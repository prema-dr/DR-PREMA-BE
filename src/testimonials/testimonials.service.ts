import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';
import { ServicesService } from '../services/services.service.js';
import { Prisma } from '../generated/prisma/client.js';
import { Paginated, PaginationQueryDto, paginated } from '../common/dto/pagination.dto.js';
import { AdminListQueryDto, CreateTestimonialDto, UpdateTestimonialDto } from './dto/testimonial.dto.js';

@Injectable()
export class TestimonialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
    private readonly services: ServicesService,
  ) {}

  async listPublic(query: PaginationQueryDto): Promise<Paginated<unknown>> {
    const where: Prisma.TestimonialWhereInput = {
      isEnabled: true,
      service: { isEnabled: true, ...(query.service && { slug: query.service }) },
    };
    const [items, total] = await Promise.all([
      this.prisma.testimonial.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        // The card itself doesn't show the service; the Patient Stories page uses it for its filter tabs.
        select: { id: true, name: true, review: true, rating: true, imageUrl: true, service: { select: { name: true, slug: true } } },
      }),
      this.prisma.testimonial.count({ where }),
    ]);
    return paginated(items, total, query.page, query.limit);
  }

  async listAdmin(query: AdminListQueryDto): Promise<Paginated<unknown>> {
    const where: Prisma.TestimonialWhereInput = {
      ...(query.serviceId && { serviceId: query.serviceId }),
      ...(query.isEnabled !== undefined && { isEnabled: query.isEnabled }),
      ...(query.search && { OR: [{ name: { contains: query.search } }, { review: { contains: query.search } }] }),
    };
    const [items, total] = await Promise.all([
      this.prisma.testimonial.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        omit: { imagePublicId: true },
        include: { service: { select: { id: true, name: true, slug: true } } },
      }),
      this.prisma.testimonial.count({ where }),
    ]);
    return paginated(items, total, query.page, query.limit);
  }

  async getAdmin(id: number) {
    const item = await this.prisma.testimonial.findUnique({
      where: { id },
      omit: { imagePublicId: true },
      include: { service: { select: { id: true, name: true, slug: true } } },
    });
    if (!item) throw new NotFoundException('Testimonial not found');
    return item;
  }

  async create(dto: CreateTestimonialDto, image?: Express.Multer.File) {
    await this.services.assertExists(dto.serviceId);
    const uploaded = image ? await this.cloudinary.upload(image, 'testimonials') : undefined;
    try {
      return await this.prisma.testimonial.create({
        data: { ...dto, imageUrl: uploaded?.url, imagePublicId: uploaded?.publicId },
        omit: { imagePublicId: true },
      });
    } catch (error) {
      await this.cloudinary.remove(uploaded?.publicId);
      throw error;
    }
  }

  async update(id: number, dto: UpdateTestimonialDto, image?: Express.Multer.File) {
    const existing = await this.prisma.testimonial.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Testimonial not found');
    if (dto.serviceId) await this.services.assertExists(dto.serviceId);

    const uploaded = image ? await this.cloudinary.upload(image, 'testimonials') : undefined;
    try {
      const updated = await this.prisma.testimonial.update({
        where: { id },
        data: { ...dto, ...(uploaded && { imageUrl: uploaded.url, imagePublicId: uploaded.publicId }) },
        omit: { imagePublicId: true },
      });
      if (uploaded) await this.cloudinary.remove(existing.imagePublicId);
      return updated;
    } catch (error) {
      await this.cloudinary.remove(uploaded?.publicId);
      throw error;
    }
  }

  async remove(id: number) {
    const item = await this.prisma.testimonial.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Testimonial not found');
    await this.prisma.testimonial.delete({ where: { id } });
    await this.cloudinary.remove(item.imagePublicId);
  }
}
