import { Controller, Get, Query } from '@nestjs/common';
import { PaginationQueryDto } from '../common/dto/pagination.dto.js';
import { TestimonialsService } from './testimonials.service.js';

@Controller('testimonials')
export class TestimonialsController {
  constructor(private readonly testimonials: TestimonialsService) {}

  @Get()
  list(@Query() query: PaginationQueryDto) {
    return this.testimonials.listPublic(query);
  }
}
