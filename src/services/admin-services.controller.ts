import {
  Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UploadedFile, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { ImageUpload } from '../common/upload/image-upload.js';
import { ServicesService } from './services.service.js';
import { CreateServiceDto, ReorderServicesDto, UpdateServiceDto } from './dto/service.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('admin/services')
export class AdminServicesController {
  constructor(private readonly services: ServicesService) {}

  @Get()
  list() {
    return this.services.listAdmin();
  }

  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number) {
    return this.services.getAdmin(id);
  }

  @Post()
  @ImageUpload('image')
  create(@Body() dto: CreateServiceDto, @UploadedFile() image?: Express.Multer.File) {
    return this.services.create(dto, image);
  }

  // Declared before ':id' routes so "reorder" is never parsed as an id.
  @Patch('reorder')
  reorder(@Body() dto: ReorderServicesDto) {
    return this.services.reorder(dto.ids);
  }

  // Also used to enable/disable a service: send { isEnabled: false }.
  @Patch(':id')
  @ImageUpload('image')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateServiceDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.services.update(id, dto, image);
  }
}
