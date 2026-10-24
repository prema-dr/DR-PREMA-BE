import {
  Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, UploadedFile, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { ImageUpload } from '../common/upload/image-upload.js';
import { AdminListQueryDto } from '../testimonials/dto/testimonial.dto.js';
import { GalleryService } from './gallery.service.js';
import { CreateGalleryImageDto, UpdateGalleryImageDto } from './dto/gallery.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('admin/gallery')
export class AdminGalleryController {
  constructor(private readonly gallery: GalleryService) {}

  @Get()
  list(@Query() query: AdminListQueryDto) {
    return this.gallery.listAdmin(query);
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.gallery.getAdmin(id);
  }

  @Post()
  @ImageUpload('image')
  create(@Body() dto: CreateGalleryImageDto, @UploadedFile() image?: Express.Multer.File) {
    return this.gallery.create(dto, image);
  }

  @Patch(':id')
  @ImageUpload('image')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGalleryImageDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.gallery.update(id, dto, image);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.gallery.remove(id);
  }
}
