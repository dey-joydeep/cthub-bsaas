import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { ThrottlerException } from '@nestjs/throttler';

/**
 * @public
 * Ensures 429 responses include a Retry-After header as per spec.
 * Keeps a simple, stable body shape for rate-limit errors.
 */
@Catch(ThrottlerException)
export class RetryAfterFilter implements ExceptionFilter<ThrottlerException> {
  catch(_exception: ThrottlerException, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const retryAfter = '60';
    res.setHeader('Retry-After', retryAfter);
    res.status(HttpStatus.TOO_MANY_REQUESTS).json({ code: 'error.rate_limited' });
  }
}
