import {
  Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { AdminListQueryDto } from '../testimonials/dto/testimonial.dto.js';
import { PublicationsService } from './publications.service.js';
import { CreatePublicationDto, UpdatePublicationDto } from './dto/publication.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('admin/publications')
export class AdminPublicationsController {
  constructor(private readonly publications: PublicationsService) {}

  @Get()
  list(@Query() query: AdminListQueryDto) {
    return this.publications.listAdmin(query);
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.publications.getAdmin(id);
  }

  @Post()
  create(@Body() dto: CreatePublicationDto) {
    return this.publications.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePublicationDto) {
    return this.publications.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.publications.remove(id);
  }
}
