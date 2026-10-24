import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(config: ConfigService) {
    super({ adapter: new PrismaMariaDb(config.getOrThrow<string>('DATABASE_URL')) });
  }

  // No eager $connect(): Prisma connects on the first query, so a slow or unreachable database
  // cannot block application startup (important for serverless cold starts).

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
