import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

// Minimal user shape required by core auth. Apps can extend this in their own layer.
export type BaseAuthUser = {
  readonly [key: string]: unknown;
  readonly id: string;
};

export interface AuthStatePort {
  // May be synchronous or asynchronous depending on app implementation
  isAuthenticated(): boolean | Promise<boolean>;
  // Optional reactive auth state the core can subscribe to (preferred if available)
  authState$?: Observable<boolean>;
  // Optional: expose current user to let core synchronize state efficiently
  currentUser$?: Observable<BaseAuthUser | null>;
  // Optional: synchronous or async accessor for current user
  getCurrentUser?(): BaseAuthUser | null | Promise<BaseAuthUser | null>;
}

export const AUTH_STATE_PORT = new InjectionToken<AuthStatePort>('AUTH_STATE_PORT');
