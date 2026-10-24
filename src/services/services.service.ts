import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';
import { Prisma } from '../generated/prisma/client.js';
import { uniqueSlug } from '../common/utils/slug.util.js';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto.js';

const PUBLIC_SERVICE = {
  id: true, name: true, slug: true, summary: true, heroHeading: true, heroSub: true,
  imageUrl: true, iconKey: true, content: true, sortOrder: true,
} satisfies Prisma.ServiceSelect;

const PUBLIC_CARD = {
  id: true, name: true, slug: true, summary: true, heroHeading: true, heroSub: true,
  imageUrl: true, iconKey: true, sortOrder: true,
} satisfies Prisma.ServiceSelect;

@Injectable()
export class ServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  // ---------- Public ----------

  listPublic() {
    return this.prisma.service.findMany({
      where: { isEnabled: true },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      select: PUBLIC_CARD,
    });
  }

  /**
   * One call for a whole service landing page: the service plus every piece of
   * content mapped to it. This is the "automatic mapping" the client asked for.
   */
  async getPublicPage(slug: string) {
    const service = await this.prisma.service.findFirst({
      where: { slug, isEnabled: true },
      select: PUBLIC_SERVICE,
    });
    if (!service) throw new NotFoundException('Service not found');

    const [blogs, testimonials, gallery, publications, videos] = await Promise.all([
      this.prisma.blog.findMany({
        where: { serviceId: service.id, isPublished: true, publishDate: { lte: new Date() } },
        orderBy: { publishDate: 'desc' },
        take: 6,
        select: {
          id: true, title: true, slug: true, excerpt: true, featuredImageUrl: true,
          imageAlt: true, readTimeMinutes: true, publishDate: true,
        },
      }),
      this.prisma.testimonial.findMany({
        where: { serviceId: service.id, isEnabled: true },
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, review: true, rating: true, imageUrl: true },
      }),
      this.prisma.galleryImage.findMany({
        where: { serviceId: service.id, isEnabled: true },
        orderBy: [{ sortOrder: 'asc' }, { id: 'desc' }],
        select: { id: true, imageUrl: true, altText: true },
      }),
      this.prisma.publication.findMany({
        where: { serviceId: service.id, isEnabled: true },
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, shortDescription: true, url: true },
      }),
      this.prisma.video.findMany({
        where: { serviceId: service.id, isEnabled: true },
        orderBy: { createdAt: 'desc' },
        select: { id: true, videoUrl: true, thumbnailUrl: true },
      }),
    ]);

    return { ...service, blogs, testimonials, gallery, publications, videos };
  }

  // ---------- Admin ----------

  listAdmin() {
    return this.prisma.service.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      omit: { content: true, imagePublicId: true },
    });
  }

  async getAdmin(id: number) {
    const service = await this.prisma.service.findUnique({ where: { id }, omit: { imagePublicId: true } });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  /** Used by every content module to validate the chosen service/category. */
  async assertExists(id: number) {
    const found = await this.prisma.service.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw new BadRequestException(`Service ${id} does not exist`);
  }

  async create(dto: CreateServiceDto, image?: Express.Multer.File) {
    const slug = dto.slug ?? (await uniqueSlug(dto.name, (s) => this.slugTaken(s)));
    if (dto.slug && (await this.slugTaken(dto.slug))) throw new ConflictException('Slug already in use');

    const uploaded = image ? await this.cloudinary.upload(image, 'services') : undefined;
    const last = await this.prisma.service.aggregate({ _max: { sortOrder: true } });

    try {
      return await this.prisma.service.create({
        data: {
          name: dto.name,
          slug,
          summary: dto.summary,
          heroHeading: dto.heroHeading,
          heroSub: dto.heroSub,
          iconKey: dto.iconKey,
          content: (dto.content ?? undefined) as Prisma.InputJsonValue | undefined,
          isEnabled: dto.isEnabled ?? true,
          sortOrder: (last._max.sortOrder ?? 0) + 1,
          imageUrl: uploaded?.url,
          imagePublicId: uploaded?.publicId,
        },
        omit: { imagePublicId: true },
      });
    } catch (error) {
      await this.cloudinary.remove(uploaded?.publicId);
      throw error;
    }
  }

  async update(id: number, dto: UpdateServiceDto, image?: Express.Multer.File) {
    const existing = await this.prisma.service.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Service not found');

    if (dto.slug && dto.slug !== existing.slug && (await this.slugTaken(dto.slug))) {
      throw new ConflictException('Slug already in use');
    }

    const uploaded = image ? await this.cloudinary.upload(image, 'services') : undefined;
    try {
      const updated = await this.prisma.service.update({
        where: { id },
        data: {
          ...dto,
          content: dto.content as Prisma.InputJsonValue | undefined,
          ...(uploaded && { imageUrl: uploaded.url, imagePublicId: uploaded.publicId }),
        },
        omit: { imagePublicId: true },
      });
      if (uploaded) await this.cloudinary.remove(existing.imagePublicId);
      return updated;
    } catch (error) {
      await this.cloudinary.remove(uploaded?.publicId);
      throw error;
    }
  }

  async reorder(ids: number[]) {
    const unique = [...new Set(ids)];
    const count = await this.prisma.service.count({ where: { id: { in: unique } } });
    if (count !== unique.length) throw new BadRequestException('Unknown service id in the list');

    await this.prisma.$transaction(
      unique.map((id, index) => this.prisma.service.update({ where: { id }, data: { sortOrder: index + 1 } })),
    );
    return this.listAdmin();
  }

  private async slugTaken(slug: string) {
    return (await this.prisma.service.count({ where: { slug } })) > 0;
  }
}
