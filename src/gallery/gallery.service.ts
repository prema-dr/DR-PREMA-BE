import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';
import { ServicesService } from '../services/services.service.js';
import { Prisma } from '../generated/prisma/client.js';
import { Paginated, PaginationQueryDto, paginated } from '../common/dto/pagination.dto.js';
import { AdminListQueryDto } from '../testimonials/dto/testimonial.dto.js';
import { CreateGalleryImageDto, UpdateGalleryImageDto } from './dto/gallery.dto.js';

@Injectable()
export class GalleryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
    private readonly services: ServicesService,
  ) {}

  listPublic(query: Pick<PaginationQueryDto, 'service'>) {
    return this.prisma.galleryImage.findMany({
      where: { isEnabled: true, service: { isEnabled: true, ...(query.service && { slug: query.service }) } },
      orderBy: [{ sortOrder: 'asc' }, { id: 'desc' }],
      select: { id: true, imageUrl: true, altText: true },
    });
  }

  async listAdmin(query: AdminListQueryDto): Promise<Paginated<unknown>> {
    const where: Prisma.GalleryImageWhereInput = {
      ...(query.serviceId && { serviceId: query.serviceId }),
      ...(query.isEnabled !== undefined && { isEnabled: query.isEnabled }),
      ...(query.search && { altText: { contains: query.search } }),
    };
    const [items, total] = await Promise.all([
      this.prisma.galleryImage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        omit: { publicId: true },
        include: { service: { select: { id: true, name: true, slug: true } } },
      }),
      this.prisma.galleryImage.count({ where }),
    ]);
    return paginated(items, total, query.page, query.limit);
  }

  async getAdmin(id: number) {
    const item = await this.prisma.galleryImage.findUnique({
      where: { id },
      omit: { publicId: true },
      include: { service: { select: { id: true, name: true, slug: true } } },
    });
    if (!item) throw new NotFoundException('Gallery image not found');
    return item;
  }

  async create(dto: CreateGalleryImageDto, image?: Express.Multer.File) {
    if (!image) throw new BadRequestException('An image file is required (field "image")');
    await this.services.assertExists(dto.serviceId);

    const uploaded = await this.cloudinary.upload(image, 'gallery');
    try {
      return await this.prisma.galleryImage.create({
        data: { ...dto, imageUrl: uploaded.url, publicId: uploaded.publicId },
        omit: { publicId: true },
      });
    } catch (error) {
      await this.cloudinary.remove(uploaded.publicId);
      throw error;
    }
  }

  async update(id: number, dto: UpdateGalleryImageDto, image?: Express.Multer.File) {
    const existing = await this.prisma.galleryImage.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Gallery image not found');
    if (dto.serviceId) await this.services.assertExists(dto.serviceId);

    const uploaded = image ? await this.cloudinary.upload(image, 'gallery') : undefined;
    try {
      const updated = await this.prisma.galleryImage.update({
        where: { id },
        data: { ...dto, ...(uploaded && { imageUrl: uploaded.url, publicId: uploaded.publicId }) },
        omit: { publicId: true },
      });
      if (uploaded) await this.cloudinary.remove(existing.publicId);
      return updated;
    } catch (error) {
      await this.cloudinary.remove(uploaded?.publicId);
      throw error;
    }
  }

  async remove(id: number) {
    const item = await this.prisma.galleryImage.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Gallery image not found');
    await this.prisma.galleryImage.delete({ where: { id } });
    await this.cloudinary.remove(item.publicId);
  }
}
