import {
  Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, UploadedFile, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { ImageUpload } from '../common/upload/image-upload.js';
import { AdminListQueryDto } from '../testimonials/dto/testimonial.dto.js';
import { VideosService } from './videos.service.js';
import { CreateVideoDto, UpdateVideoDto } from './dto/video.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('admin/videos')
export class AdminVideosController {
  constructor(private readonly videos: VideosService) {}

  @Get()
  list(@Query() query: AdminListQueryDto) {
    return this.videos.listAdmin(query);
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.videos.getAdmin(id);
  }

  @Post()
  @ImageUpload('thumbnail')
  create(@Body() dto: CreateVideoDto, @UploadedFile() thumbnail?: Express.Multer.File) {
    return this.videos.create(dto, thumbnail);
  }

  @Patch(':id')
  @ImageUpload('thumbnail')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVideoDto,
    @UploadedFile() thumbnail?: Express.Multer.File,
  ) {
    return this.videos.update(id, dto, thumbnail);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.videos.remove(id);
  }
}
