import { Controller, Get, Query } from '@nestjs/common';
import { PaginationQueryDto } from '../common/dto/pagination.dto.js';
import { GalleryService } from './gallery.service.js';

@Controller('gallery')
export class GalleryController {
  constructor(private readonly gallery: GalleryService) {}

  // GET /gallery?service=vbac
  @Get()
  list(@Query() query: PaginationQueryDto) {
    return this.gallery.listPublic(query);
  }
}
