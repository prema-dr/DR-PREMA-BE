import { Module } from '@nestjs/common';
import { ServicesModule } from '../services/services.module.js';
import { AdminTestimonialsController } from './admin-testimonials.controller.js';
import { TestimonialsController } from './testimonials.controller.js';
import { TestimonialsService } from './testimonials.service.js';

@Module({
  imports: [ServicesModule],
  controllers: [TestimonialsController, AdminTestimonialsController],
  providers: [TestimonialsService],
})
export class TestimonialsModule {}
