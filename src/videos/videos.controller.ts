import { Controller, Get, Query } from '@nestjs/common';
import { PaginationQueryDto } from '../common/dto/pagination.dto.js';
import { VideosService } from './videos.service.js';

@Controller('videos')
export class VideosController {
  constructor(private readonly videos: VideosService) {}

  @Get()
  list(@Query() query: PaginationQueryDto) {
    return this.videos.listPublic(query);
  }
}
