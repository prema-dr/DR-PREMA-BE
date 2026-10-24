import { Module } from '@nestjs/common';
import { ServicesModule } from '../services/services.module.js';
import { AdminPublicationsController } from './admin-publications.controller.js';
import { PublicationsController } from './publications.controller.js';
import { PublicationsService } from './publications.service.js';

@Module({
  imports: [ServicesModule],
  controllers: [PublicationsController, AdminPublicationsController],
  providers: [PublicationsService],
})
export class PublicationsModule {}
