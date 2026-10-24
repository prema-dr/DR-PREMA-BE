import { Module } from '@nestjs/common';
import { ServicesModule } from '../services/services.module.js';
import { AdminVideosController } from './admin-videos.controller.js';
import { VideosController } from './videos.controller.js';
import { VideosService } from './videos.service.js';

@Module({
  imports: [ServicesModule],
  controllers: [VideosController, AdminVideosController],
  providers: [VideosService],
})
export class VideosModule {}
