import { Module } from '@nestjs/common';
import { RATE_LIMITER } from './rate-limiter';
import { RedisRateLimiter } from './rate-limiter.redis';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [{ provide: RATE_LIMITER, useClass: RedisRateLimiter }],
  exports: [RATE_LIMITER],
})
export class RateLimitModule {}
