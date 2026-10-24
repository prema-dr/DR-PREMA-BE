import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';
import { ServicesService } from '../services/services.service.js';
import { Prisma } from '../generated/prisma/client.js';
import { Paginated, PaginationQueryDto, paginated } from '../common/dto/pagination.dto.js';
import { makeExcerpt, readTimeMinutes, sanitizeBlogHtml } from '../common/utils/content.util.js';
import { normalizeUrlRewrite, uniqueSlug } from '../common/utils/slug.util.js';
import { AdminBlogQueryDto, CreateBlogDto, UpdateBlogDto } from './dto/blog.dto.js';

const LIST_SELECT = {
  id: true, title: true, slug: true, excerpt: true, featuredImageUrl: true, imageAlt: true,
  readTimeMinutes: true, publishDate: true, service: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.BlogSelect;

@Injectable()
export class BlogsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
    private readonly services: ServicesService,
  ) {}

  // ---------- Public ----------

  private publicWhere(query: PaginationQueryDto): Prisma.BlogWhereInput {
    return {
      isPublished: true,
      publishDate: { lte: new Date() },
      service: { isEnabled: true, ...(query.service && { slug: query.service }) },
      ...(query.search && {
        OR: [{ title: { contains: query.search } }, { excerpt: { contains: query.search } }],
      }),
    };
  }

  async listPublic(query: PaginationQueryDto): Promise<Paginated<unknown>> {
    const where = this.publicWhere(query);
    const [items, total] = await Promise.all([
      this.prisma.blog.findMany({
        where,
        orderBy: { publishDate: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: LIST_SELECT,
      }),
      this.prisma.blog.count({ where }),
    ]);
    return paginated(items, total, query.page, query.limit);
  }

  async getPublic(slugOrPath: string) {
    const blog = await this.prisma.blog.findFirst({
      where: {
        OR: [{ slug: slugOrPath }, { urlRewrite: slugOrPath }],
        isPublished: true,
        publishDate: { lte: new Date() },
        service: { isEnabled: true },
      },
      omit: { featuredImagePublicId: true },
      include: { service: { select: { id: true, name: true, slug: true } } },
    });
    if (!blog) throw new NotFoundException('Blog not found');
    return blog;
  }

  // ---------- Admin ----------

  async listAdmin(query: AdminBlogQueryDto): Promise<Paginated<unknown>> {
    const where: Prisma.BlogWhereInput = {
      ...(query.serviceId && { serviceId: query.serviceId }),
      ...(query.status && { isPublished: query.status === 'published' }),
      ...(query.search && { title: { contains: query.search } }),
    };
    const [items, total] = await Promise.all([
      this.prisma.blog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        omit: { content: true, featuredImagePublicId: true },
        include: { service: { select: { id: true, name: true, slug: true } } },
      }),
      this.prisma.blog.count({ where }),
    ]);
    return paginated(items, total, query.page, query.limit);
  }

  async getAdmin(id: number) {
    const blog = await this.prisma.blog.findUnique({
      where: { id },
      omit: { featuredImagePublicId: true },
      include: { service: { select: { id: true, name: true, slug: true } } },
    });
    if (!blog) throw new NotFoundException('Blog not found');
    return blog;
  }

  async create(dto: CreateBlogDto, image?: Express.Multer.File) {
    await this.services.assertExists(dto.serviceId);
    if (image && !dto.imageAlt) throw new BadRequestException('imageAlt is required when uploading an image');

    const slug = dto.slug ?? (await uniqueSlug(dto.title, (s) => this.slugTaken(s)));
    if (dto.slug && (await this.slugTaken(dto.slug))) throw new ConflictException('Slug already in use');
    const urlRewrite = normalizeUrlRewrite(dto.urlRewrite);
    if (urlRewrite && (await this.rewriteTaken(urlRewrite))) throw new ConflictException('URL rewrite already in use');

    const content = sanitizeBlogHtml(dto.content);
    const uploaded = image ? await this.cloudinary.upload(image, 'blogs') : undefined;

    try {
      return await this.prisma.blog.create({
        data: {
          serviceId: dto.serviceId,
          title: dto.title,
          slug,
          urlRewrite,
          metaTitle: dto.metaTitle,
          metaDescription: dto.metaDescription,
          imageAlt: dto.imageAlt,
          content,
          excerpt: dto.excerpt ?? makeExcerpt(content),
          readTimeMinutes: readTimeMinutes(content),
          isPublished: dto.isPublished ?? false,
          publishDate: dto.publishDate ?? new Date(),
          featuredImageUrl: uploaded?.url,
          featuredImagePublicId: uploaded?.publicId,
        },
        omit: { featuredImagePublicId: true },
      });
    } catch (error) {
      await this.cloudinary.remove(uploaded?.publicId);
      throw error;
    }
  }

  async update(id: number, dto: UpdateBlogDto, image?: Express.Multer.File) {
    const existing = await this.prisma.blog.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Blog not found');

    if (dto.serviceId) await this.services.assertExists(dto.serviceId);
    if (dto.slug && dto.slug !== existing.slug && (await this.slugTaken(dto.slug))) {
      throw new ConflictException('Slug already in use');
    }
    const urlRewrite = dto.urlRewrite === undefined ? undefined : normalizeUrlRewrite(dto.urlRewrite);
    if (urlRewrite && urlRewrite !== existing.urlRewrite && (await this.rewriteTaken(urlRewrite))) {
      throw new ConflictException('URL rewrite already in use');
    }
    if (image && !(dto.imageAlt ?? existing.imageAlt)) {
      throw new BadRequestException('imageAlt is required when uploading an image');
    }

    const content = dto.content === undefined ? undefined : sanitizeBlogHtml(dto.content);
    const uploaded = image ? await this.cloudinary.upload(image, 'blogs') : undefined;

    try {
      const updated = await this.prisma.blog.update({
        where: { id },
        data: {
          ...dto,
          urlRewrite,
          content,
          ...(content !== undefined && {
            readTimeMinutes: readTimeMinutes(content),
            excerpt: dto.excerpt ?? makeExcerpt(content),
          }),
          ...(uploaded && { featuredImageUrl: uploaded.url, featuredImagePublicId: uploaded.publicId }),
        },
        omit: { featuredImagePublicId: true },
      });
      if (uploaded) await this.cloudinary.remove(existing.featuredImagePublicId);
      return updated;
    } catch (error) {
      await this.cloudinary.remove(uploaded?.publicId);
      throw error;
    }
  }

  setPublished(id: number, isPublished: boolean) {
    return this.prisma.blog.update({
      where: { id },
      data: { isPublished },
      omit: { content: true, featuredImagePublicId: true },
    });
  }

  async remove(id: number) {
    const blog = await this.prisma.blog.findUnique({ where: { id } });
    if (!blog) throw new NotFoundException('Blog not found');
    await this.prisma.blog.delete({ where: { id } });
    await this.cloudinary.remove(blog.featuredImagePublicId);
  }

  private async slugTaken(slug: string) {
    return (await this.prisma.blog.count({ where: { slug } })) > 0;
  }

  private async rewriteTaken(urlRewrite: string) {
    return (await this.prisma.blog.count({ where: { urlRewrite } })) > 0;
  }
}
