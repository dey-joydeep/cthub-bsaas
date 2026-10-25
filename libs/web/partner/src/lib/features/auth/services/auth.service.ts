import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom, forkJoin, of } from 'rxjs';

import { StorageService } from '@cthub-bsaas/web-core-platform';
import type { AuthStatePort } from '@cthub-bsaas/web-core/auth';
import { hasManagerCapability } from '@cthub-bsaas/shared';
import type { PartnerAuthUser } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService implements AuthStatePort {
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly TOKEN_EXPIRY_KEY = 'token_expiry';
  private readonly USER_KEY = 'current_user';

  private readonly isBrowser: boolean;
  private currentUserSubject = new BehaviorSubject<PartnerAuthUser | null>(null);
  public readonly currentUser$: Observable<PartnerAuthUser | null> = this.currentUserSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private readonly platformId: object, private readonly storage: StorageService) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.initializeAuthState();
    }
  }

  getCurrentUser(): PartnerAuthUser | null {
    const user = this.currentUserSubject.value;
    return user ? { ...user } : null;
  }

  async isAuthenticated(): Promise<boolean> {
    if (!this.isBrowser) return false;
    const token = await firstValueFrom(this.getToken());
    return this.isTokenValid(token);
  }

  async logout(): Promise<void> {
    this.clearAuthData();
  }

  public setLoggedInUser(user: PartnerAuthUser): void {
    if (!this.isBrowser) return;
    const enrichedUser = this.enrichUser(user);
    this.currentUserSubject.next(enrichedUser);
    this.storage.setItem$(this.USER_KEY, enrichedUser).subscribe();
  }

  public clearAuthData(): void {
    if (!this.isBrowser) return;

    forkJoin([
      this.storage.removeItem$(this.TOKEN_KEY),
      this.storage.removeItem$(this.REFRESH_TOKEN_KEY),
      this.storage.removeItem$(this.TOKEN_EXPIRY_KEY),
      this.storage.removeItem$(this.USER_KEY),
    ]).subscribe({
      complete: () => this.currentUserSubject.next(null),
      error: () => this.currentUserSubject.next(null),
    });
  }

  private initializeAuthState(): void {
    this.storage.getItem$<PartnerAuthUser>(this.USER_KEY).subscribe({
      next: (user: PartnerAuthUser | null) => {
        if (user) {
          const enrichedUser = this.enrichUser(user);
          this.currentUserSubject.next(enrichedUser);
        }
      },
      error: () => this.clearAuthData(),
    });
  }

  private enrichUser(user: PartnerAuthUser): PartnerAuthUser {
    let managedBranchIds = user.managedBranchIds;
    let canManageBranches = user.canManageBranches;
    let roles = user.roles;

    const token =
      typeof user.accessToken === 'string' && user.accessToken.length > 0
        ? user.accessToken
        : this.storage.getItem<string>(this.TOKEN_KEY, null);

    if (token) {
      const payload = this.decodeTokenPayload(token);
      if (payload) {
        if (!managedBranchIds && Array.isArray(payload['managedBranchIds'])) {
          managedBranchIds = payload['managedBranchIds'] as string[];
        }
        if (canManageBranches === undefined && typeof payload['canManageBranches'] === 'boolean') {
          canManageBranches = payload['canManageBranches'];
        }
        if (!roles && Array.isArray(payload['roles'])) {
          roles = (payload['roles'] as unknown[]).map(String);
        }
      }
    }

    const candidate: PartnerAuthUser = {
      ...user,
      ...(roles ? { roles } : {}),
      ...(managedBranchIds ? { managedBranchIds } : {}),
      canManageBranches,
    };

    return {
      ...candidate,
      canManageBranches: candidate.canManageBranches ?? hasManagerCapability(candidate),
    };
  }

  private getToken(): Observable<string | null> {
    if (!this.isBrowser) return of(null);
    const token = this.storage.getItem<string>(this.TOKEN_KEY, null);
    return of(typeof token === 'string' ? token : null);
  }

  private decodeTokenPayload(token: string | null | undefined): Record<string, unknown> | null {
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private isTokenValid(token: string | null | undefined): boolean {
    const payload = this.decodeTokenPayload(token);
    if (!payload || typeof payload['exp'] !== 'number') return false;
    const currentTime = Math.floor(Date.now() / 1000);
    return payload['exp'] > currentTime;
  }
}
