import { Module } from '@nestjs/common';
import { ServicesModule } from '../services/services.module.js';
import { AdminGalleryController } from './admin-gallery.controller.js';
import { GalleryController } from './gallery.controller.js';
import { GalleryService } from './gallery.service.js';

@Module({
  imports: [ServicesModule],
  controllers: [GalleryController, AdminGalleryController],
  providers: [GalleryService],
})
export class GalleryModule {}
