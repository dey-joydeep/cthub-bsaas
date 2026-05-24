import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Injectable } from '@nestjs/common';
import { Response } from 'express';
import { ThrottlerException } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { CorrelationId } from '@cthub-bsaas/server-core';
import { COMMON_MESSAGE_KEYS } from '@cthub-bsaas/shared';

/**
 * Adds a Retry-After header and a stable error code for rate-limited responses (429).
 * Falls back to a default TTL of 60s when config is unavailable.
 */
@Catch(ThrottlerException)
@Injectable()
export class ThrottlerRetryAfterFilter implements ExceptionFilter<ThrottlerException> {
  constructor(private readonly config: ConfigService) {}

  catch(_exception: ThrottlerException, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const ttl = this.config.get<number>('throttle.ttl', 60);
    res.setHeader('Retry-After', String(ttl));
    const correlationId = CorrelationId.get?.();
    const body: Record<string, unknown> = {
      success: false,
      code: COMMON_MESSAGE_KEYS.ERROR.RATE_LIMITED,
      message: 'Too many requests',
    };
    if (correlationId) body.meta = { correlationId };
    res.status(HttpStatus.TOO_MANY_REQUESTS).json(body);
  }
}
