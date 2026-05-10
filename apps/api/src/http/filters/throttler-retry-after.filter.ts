import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Injectable } from '@nestjs/common';
import { Response } from 'express';
import { ThrottlerException } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';

/**
 * Adds a Retry-After header and a stable error code for rate-limited responses (429).
 * Falls back to a default TTL of 60s when config is unavailable.
 */
@Catch(ThrottlerException)
@Injectable()
export class ThrottlerRetryAfterFilter implements ExceptionFilter<ThrottlerException> {
  constructor(private readonly config: ConfigService) {}

  catch(_exception: ThrottlerException, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const ttl = this.config.get<number>('throttle.ttl', 60);
    res.setHeader('Retry-After', String(ttl));
    res.status(HttpStatus.TOO_MANY_REQUESTS).json({ code: 'error.rate_limited' });
  }
}
