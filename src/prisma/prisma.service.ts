import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly dbUrl: string;
  private readonly hasCa: boolean;

  constructor(config: ConfigService) {
    super({ adapter: new PrismaMariaDb(PrismaService.connectionConfig(config)) });
    this.dbUrl = config.getOrThrow<string>('DATABASE_URL');
    this.hasCa = !!config.get<string>('DB_CA_CERT');
  }

  // With DB_CA_CERT (PEM text, e.g. Aiven's CA) the connection is TLS-verified against that CA;
  // otherwise the URL is handed to the driver unchanged.
  private static connectionConfig(config: ConfigService) {
    const url = config.getOrThrow<string>('DATABASE_URL');
    const ca = config.get<string>('DB_CA_CERT')?.replace(/\\n/g, '\n');
    if (!ca) return url;
    const u = new URL(url);
    return {
      host: u.hostname,
      port: u.port ? Number(u.port) : 3306,
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: u.pathname.slice(1),
      ssl: { ca },
    };
  }

  // Fire-and-forget connectivity check: logs the outcome but never blocks or fails startup.
  onModuleInit() {
    const url = new URL(this.dbUrl);
    const target = `${url.hostname}:${url.port || 3306}${url.pathname}`;
    console.log(`[db] checking connection to ${target} (ca cert: ${this.hasCa ? 'yes' : 'no'})`);
    this.$queryRaw`SELECT 1`
      .then(() => console.log(`[db] connected to ${target}`))
      .catch((err: Error & { code?: string; cause?: unknown }) =>
        console.error(`[db] connection to ${target} failed: ${err.name} ${err.code ?? ''} ${err.message}`, err.cause ?? ''),
      );
  }

  // No eager $connect(): Prisma connects on the first query, so a slow or unreachable database
  // cannot block application startup (important for serverless cold starts).

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
