import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { RateLimitGuard } from './common/guards/rate-limit.guard.js';
import { validateEnv } from './config/env.validation.js';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { CloudinaryModule } from './cloudinary/cloudinary.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ServicesModule } from './services/services.module.js';
import { BlogsModule } from './blogs/blogs.module.js';
import { TestimonialsModule } from './testimonials/testimonials.module.js';
import { GalleryModule } from './gallery/gallery.module.js';
import { PublicationsModule } from './publications/publications.module.js';
import { VideosModule } from './videos/videos.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { HealthController } from './health/health.controller.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    PrismaModule,
    CloudinaryModule,
    AuthModule,
    ServicesModule,
    BlogsModule,
    TestimonialsModule,
    GalleryModule,
    PublicationsModule,
    VideosModule,
    DashboardModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: RateLimitGuard },
    { provide: APP_FILTER, useClass: PrismaExceptionFilter },
  ],
})
export class AppModule {}
