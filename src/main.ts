import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module.js';

// helmet ships CJS types (index.d.cts); depending on the build's module resolution
// the default import is either the function or the module namespace.
const helmetFn = ((helmet as unknown as { default?: typeof helmet }).default ??
  helmet) as unknown as (typeof import('helmet'))['default'];

async function bootstrap() {
  console.log('[boot] creating Nest app');
  const app = await NestFactory.create(AppModule);
  console.log('[boot] app created');
  const config = app.get(ConfigService);

  app.use(helmetFn());
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: config.get<string>('CORS_ORIGINS', 'http://localhost:3000').split(',').map((o) => o.trim()),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.enableShutdownHooks();

  const port = config.get<number>('PORT', 4000);
  await app.listen(port);
  console.log(`[boot] listening on ${port}`);
}
// Not awaited: Vercel's runtime waits for this module to finish loading before it serves requests,
// so a top-level await on listen() can deadlock startup.
bootstrap().catch((err) => {
  console.error('[boot] failed to start', err);
  process.exit(1);
});
