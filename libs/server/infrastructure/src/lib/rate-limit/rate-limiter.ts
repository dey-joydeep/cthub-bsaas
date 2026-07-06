import { InjectionToken } from '@nestjs/common';

export const RATE_LIMITER = Symbol('RATE_LIMITER') as unknown as InjectionToken;

export interface RateLimiter {
  /**
   * Increment a counter for the key within a fixed window; throw if above limit.
   * @param key Unique key (e.g., `email:verify:<email>`)
   * @param limit Max allowed within the window
   * @param windowSec Window length in seconds
   */
  checkOrThrow(key: string, limit: number, windowSec: number): Promise<void>;
}
