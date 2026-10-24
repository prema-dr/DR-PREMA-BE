import { Controller, Get, Param } from '@nestjs/common';
import { ServicesService } from './services.service.js';

@Controller('services')
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

  @Get()
  list() {
    return this.services.listPublic();
  }

  // Service landing page data, including all mapped blogs/testimonials/gallery/publications/videos.
  @Get(':slug')
  page(@Param('slug') slug: string) {
    return this.services.getPublicPage(slug);
  }
}
