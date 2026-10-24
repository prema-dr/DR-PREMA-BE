import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// In-memory fixed-window rate limiter (per server instance), replacing @nestjs/throttler,
// which is CommonJS and cannot require() the ESM-only NestJS 12 packages on older Node runtimes.
const LIMIT_KEY = 'rate-limit';
const SKIP_KEY = 'rate-limit-skip';

export const RateLimit = (limit: number, ttl: number) => SetMetadata(LIMIT_KEY, { limit, ttl });
export const SkipRateLimit = () => SetMetadata(SKIP_KEY, true);

const DEFAULT = { limit: 120, ttl: 60_000 };

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly hits = new Map<string, { count: number; resetAt: number }>();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(SKIP_KEY, targets)) return true;

    const { limit, ttl } =
      this.reflector.getAllAndOverride<{ limit: number; ttl: number }>(LIMIT_KEY, targets) ?? DEFAULT;
    const req = context.switchToHttp().getRequest<{ ip?: string; method: string; url: string }>();
    const route = `${context.getClass().name}.${context.getHandler().name}`;
    const key = `${req.ip ?? 'unknown'}:${route}`;
    const now = Date.now();

    if (this.hits.size > 10_000) {
      for (const [k, v] of this.hits) if (v.resetAt <= now) this.hits.delete(k);
    }

    const entry = this.hits.get(key);
    if (!entry || entry.resetAt <= now) {
      this.hits.set(key, { count: 1, resetAt: now + ttl });
      return true;
    }
    if (++entry.count > limit) {
      throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
    }
    return true;
  }
}
