import { Controller, Get, Param, Query } from '@nestjs/common';
import { PaginationQueryDto } from '../common/dto/pagination.dto.js';
import { BlogsService } from './blogs.service.js';

@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogs: BlogsService) {}

  // GET /blogs?service=vbac&page=1&limit=9&search=...
  @Get()
  list(@Query() query: PaginationQueryDto) {
    return this.blogs.listPublic(query);
  }

  // Resolves by slug or by the custom urlRewrite path (which may contain slashes, e.g. /blogs/vbac/myths).
  @Get('*path')
  get(@Param('path') path: string | string[]) {
    return this.blogs.getPublic(Array.isArray(path) ? path.join('/') : path);
  }
}
