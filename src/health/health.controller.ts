import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { SkipRateLimit } from '../common/guards/rate-limit.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';

@SkipRateLimit()
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok' };
    } catch {
      throw new ServiceUnavailableException('Database unreachable');
    }
  }
}
