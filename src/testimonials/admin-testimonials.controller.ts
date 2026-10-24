import {
  Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query, UploadedFile, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { ImageUpload } from '../common/upload/image-upload.js';
import { TestimonialsService } from './testimonials.service.js';
import { AdminListQueryDto, CreateTestimonialDto, UpdateTestimonialDto } from './dto/testimonial.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('admin/testimonials')
export class AdminTestimonialsController {
  constructor(private readonly testimonials: TestimonialsService) {}

  @Get()
  list(@Query() query: AdminListQueryDto) {
    return this.testimonials.listAdmin(query);
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.testimonials.getAdmin(id);
  }

  @Post()
  @ImageUpload('image')
  create(@Body() dto: CreateTestimonialDto, @UploadedFile() image?: Express.Multer.File) {
    return this.testimonials.create(dto, image);
  }

  // Also the enable/disable switch: send { isEnabled: false }.
  @Patch(':id')
  @ImageUpload('image')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTestimonialDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.testimonials.update(id, dto, image);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.testimonials.remove(id);
  }
}
