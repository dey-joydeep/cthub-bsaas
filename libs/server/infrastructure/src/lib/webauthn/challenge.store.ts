import { InjectionToken } from '@nestjs/common';

export const CHALLENGE_STORE = Symbol('WEB_AUTHN_CHALLENGE_STORE') as unknown as InjectionToken;

export interface ChallengeStore {
  /** Store a challenge with TTL (seconds). */
  set(key: string, value: string, ttlSec: number): Promise<void>;
  /** Atomically retrieve and delete a challenge by key; returns null if missing. */
  consume(key: string): Promise<string | null>;
}
