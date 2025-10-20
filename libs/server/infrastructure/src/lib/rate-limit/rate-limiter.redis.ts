import { Injectable } from '@nestjs/common';
import type { RateLimiter } from './rate-limiter';
import { ConfigService } from '@cthub-bsaas/server-core';
import Redis from 'ioredis';

@Injectable()
export class RedisRateLimiter implements RateLimiter {
  private client: Redis;

  constructor(private readonly cfg: ConfigService) {
    const url = (this.cfg.get<string>('REDIS_URL') ?? 'redis://localhost:6379/0').toString();
    this.client = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 2 });
  }

  async checkOrThrow(key: string, limit: number, windowSec: number): Promise<void> {
    const k = `rl:${key}`;
    const multi = this.client.multi();
    multi.incr(k);
    multi.ttl(k);
    const [count, ttl] = (await multi.exec()) as unknown as [number, number];
    if (typeof count !== 'number') return;
    if (ttl === -1) {
      await this.client.expire(k, windowSec);
    }
    if (count > limit) {
      const retryAfter = ttl > 0 ? ttl : windowSec;
      type RateLimitError = Error & { retryAfter?: number };
      const err = new Error('rate_limit_exceeded') as RateLimitError;
      err.retryAfter = retryAfter;
      throw err;
    }
  }
}
