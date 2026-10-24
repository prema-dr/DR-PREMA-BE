import {
  Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, UploadedFile, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { ImageUpload } from '../common/upload/image-upload.js';
import { BlogsService } from './blogs.service.js';
import { AdminBlogQueryDto, CreateBlogDto, PublishBlogDto, UpdateBlogDto } from './dto/blog.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('admin/blogs')
export class AdminBlogsController {
  constructor(private readonly blogs: BlogsService) {}

  @Get()
  list(@Query() query: AdminBlogQueryDto) {
    return this.blogs.listAdmin(query);
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.blogs.getAdmin(id);
  }

  @Post()
  @ImageUpload('featuredImage')
  create(@Body() dto: CreateBlogDto, @UploadedFile() image?: Express.Multer.File) {
    return this.blogs.create(dto, image);
  }

  @Patch(':id')
  @ImageUpload('featuredImage')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBlogDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.blogs.update(id, dto, image);
  }

  // Publish / Unpublish toggle.
  @Patch(':id/publish')
  publish(@Param('id', ParseIntPipe) id: number, @Body() dto: PublishBlogDto) {
    return this.blogs.setPublished(id, dto.isPublished);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.blogs.remove(id);
  }
}
