import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';

@UseGuards(JwtAuthGuard)
@Controller('admin/dashboard')
export class DashboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async overview() {
    const [services, blogs, testimonials, galleryImages, publications, videos] = await Promise.all([
      this.prisma.service.count(),
      this.prisma.blog.count(),
      this.prisma.testimonial.count(),
      this.prisma.galleryImage.count(),
      this.prisma.publication.count(),
      this.prisma.video.count(),
    ]);
    return { services, blogs, testimonials, galleryImages, publications, videos };
  }
}
