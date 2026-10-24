import { Module } from '@nestjs/common';
import { ServicesModule } from '../services/services.module.js';
import { AdminBlogsController } from './admin-blogs.controller.js';
import { BlogsController } from './blogs.controller.js';
import { BlogsService } from './blogs.service.js';

@Module({
  imports: [ServicesModule],
  controllers: [BlogsController, AdminBlogsController],
  providers: [BlogsService],
})
export class BlogsModule {}
