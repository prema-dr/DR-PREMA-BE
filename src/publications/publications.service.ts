import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ServicesService } from '../services/services.service.js';
import { Prisma } from '../generated/prisma/client.js';
import { Paginated, PaginationQueryDto, paginated } from '../common/dto/pagination.dto.js';
import { AdminListQueryDto } from '../testimonials/dto/testimonial.dto.js';
import { CreatePublicationDto, UpdatePublicationDto } from './dto/publication.dto.js';

@Injectable()
export class PublicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly services: ServicesService,
  ) {}

  listPublic(query: Pick<PaginationQueryDto, 'service'>) {
    return this.prisma.publication.findMany({
      where: { isEnabled: true, service: { isEnabled: true, ...(query.service && { slug: query.service }) } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, shortDescription: true, url: true },
    });
  }

  async listAdmin(query: AdminListQueryDto): Promise<Paginated<unknown>> {
    const where: Prisma.PublicationWhereInput = {
      ...(query.serviceId && { serviceId: query.serviceId }),
      ...(query.isEnabled !== undefined && { isEnabled: query.isEnabled }),
      ...(query.search && { title: { contains: query.search } }),
    };
    const [items, total] = await Promise.all([
      this.prisma.publication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: { service: { select: { id: true, name: true, slug: true } } },
      }),
      this.prisma.publication.count({ where }),
    ]);
    return paginated(items, total, query.page, query.limit);
  }

  async getAdmin(id: number) {
    const item = await this.prisma.publication.findUnique({
      where: { id },
      include: { service: { select: { id: true, name: true, slug: true } } },
    });
    if (!item) throw new NotFoundException('Publication not found');
    return item;
  }

  async create(dto: CreatePublicationDto) {
    await this.services.assertExists(dto.serviceId);
    return this.prisma.publication.create({ data: dto });
  }

  async update(id: number, dto: UpdatePublicationDto) {
    if (dto.serviceId) await this.services.assertExists(dto.serviceId);
    return this.prisma.publication.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.prisma.publication.delete({ where: { id } });
  }
}
