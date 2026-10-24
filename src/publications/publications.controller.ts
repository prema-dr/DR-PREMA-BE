import { Controller, Get, Query } from '@nestjs/common';
import { PaginationQueryDto } from '../common/dto/pagination.dto.js';
import { PublicationsService } from './publications.service.js';

@Controller('publications')
export class PublicationsController {
  constructor(private readonly publications: PublicationsService) {}

  @Get()
  list(@Query() query: PaginationQueryDto) {
    return this.publications.listPublic(query);
  }
}
