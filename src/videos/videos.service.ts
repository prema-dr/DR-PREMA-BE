import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';
import { ServicesService } from '../services/services.service.js';
import { Prisma } from '../generated/prisma/client.js';
import { Paginated, PaginationQueryDto, paginated } from '../common/dto/pagination.dto.js';
import { AdminListQueryDto } from '../testimonials/dto/testimonial.dto.js';
import { CreateVideoDto, UpdateVideoDto } from './dto/video.dto.js';

@Injectable()
export class VideosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
    private readonly services: ServicesService,
  ) {}

  listPublic(query: Pick<PaginationQueryDto, 'service'>) {
    return this.prisma.video.findMany({
      where: { isEnabled: true, service: { isEnabled: true, ...(query.service && { slug: query.service }) } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, videoUrl: true, thumbnailUrl: true },
    });
  }

  async listAdmin(query: AdminListQueryDto): Promise<Paginated<unknown>> {
    const where: Prisma.VideoWhereInput = {
      ...(query.serviceId && { serviceId: query.serviceId }),
      ...(query.isEnabled !== undefined && { isEnabled: query.isEnabled }),
    };
    const [items, total] = await Promise.all([
      this.prisma.video.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        omit: { thumbnailPublicId: true },
        include: { service: { select: { id: true, name: true, slug: true } } },
      }),
      this.prisma.video.count({ where }),
    ]);
    return paginated(items, total, query.page, query.limit);
  }

  async getAdmin(id: number) {
    const item = await this.prisma.video.findUnique({
      where: { id },
      omit: { thumbnailPublicId: true },
      include: { service: { select: { id: true, name: true, slug: true } } },
    });
    if (!item) throw new NotFoundException('Video not found');
    return item;
  }

  async create(dto: CreateVideoDto, thumbnail?: Express.Multer.File) {
    await this.services.assertExists(dto.serviceId);

    // The thumbnail is optional: the website plays the reel from its Instagram link.
    const uploaded = thumbnail ? await this.cloudinary.upload(thumbnail, 'videos') : undefined;
    try {
      return await this.prisma.video.create({
        data: { ...dto, thumbnailUrl: uploaded?.url, thumbnailPublicId: uploaded?.publicId },
        omit: { thumbnailPublicId: true },
      });
    } catch (error) {
      await this.cloudinary.remove(uploaded?.publicId);
      throw error;
    }
  }

  async update(id: number, dto: UpdateVideoDto, thumbnail?: Express.Multer.File) {
    const existing = await this.prisma.video.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Video not found');
    if (dto.serviceId) await this.services.assertExists(dto.serviceId);

    const uploaded = thumbnail ? await this.cloudinary.upload(thumbnail, 'videos') : undefined;
    try {
      const updated = await this.prisma.video.update({
        where: { id },
        data: { ...dto, ...(uploaded && { thumbnailUrl: uploaded.url, thumbnailPublicId: uploaded.publicId }) },
        omit: { thumbnailPublicId: true },
      });
      if (uploaded) await this.cloudinary.remove(existing.thumbnailPublicId);
      return updated;
    } catch (error) {
      await this.cloudinary.remove(uploaded?.publicId);
      throw error;
    }
  }

  async remove(id: number) {
    const item = await this.prisma.video.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Video not found');
    await this.prisma.video.delete({ where: { id } });
    await this.cloudinary.remove(item.thumbnailPublicId);
  }
}
