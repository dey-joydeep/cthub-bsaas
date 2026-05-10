import { InjectionToken } from '@nestjs/common';

export const OAUTH_STATE_STORE = Symbol('OAUTH_STATE_STORE') as unknown as InjectionToken;

export interface OAuthStateStore {
  set(state: string, ttlSec: number): Promise<void>;
  consume(state: string): Promise<boolean>;
}
