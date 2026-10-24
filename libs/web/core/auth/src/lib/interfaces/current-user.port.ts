import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

// Minimal shape required by guards/components that need role
export interface CurrentUserMin {
  readonly id?: string;
  readonly role?: string;
  readonly roles?: readonly string[];
  readonly isVerified?: boolean;
  readonly is_verified?: boolean;
  readonly managedBranchIds?: readonly string[];
  readonly canManageBranches?: boolean;
}

export interface CurrentUserPort {
  readonly currentUser$: Observable<CurrentUserMin | null>;
  readonly isAuthenticated$: Observable<boolean>;
  redirectUrl: string | null;
}

export const CURRENT_USER = new InjectionToken<CurrentUserPort>('CURRENT_USER');
