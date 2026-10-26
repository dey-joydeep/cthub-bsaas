import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, Optional, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom, of } from 'rxjs';

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
  private initPromise: Promise<PartnerAuthUser | null> | null = null;

  constructor(
    @Inject(PLATFORM_ID) private readonly platformId: object,
    private readonly storage: StorageService,
    @Optional() @Inject(HttpClient) private readonly http?: HttpClient,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.initialize();
    }
  }

  public initialize(): Promise<PartnerAuthUser | null> {
    if (!this.isBrowser) return Promise.resolve(null);
    if (!this.initPromise) {
      this.initPromise = this.performInitialization();
    }
    return this.initPromise;
  }

  private async performInitialization(): Promise<PartnerAuthUser | null> {
    try {
      const cached = this.storage.getItem<PartnerAuthUser>(this.USER_KEY, null);
      if (cached) {
        this.currentUserSubject.next(this.enrichUser(cached));
      }
      if (this.http) {
        return await this.hydrateCurrentUser();
      }
      return this.getCurrentUser();
    } catch {
      return this.getCurrentUser();
    }
  }

  getCurrentUser(): PartnerAuthUser | null {
    const user = this.currentUserSubject.value;
    return user ? { ...user } : null;
  }

  async isAuthenticated(): Promise<boolean> {
    if (!this.isBrowser) return false;
    const token = await firstValueFrom(this.getToken());
    if (this.isTokenValid(token)) {
      return true;
    }
    if (this.currentUserSubject.value !== null) {
      return true;
    }
    if (this.http) {
      const user = await this.hydrateCurrentUser();
      return user !== null;
    }
    return false;
  }

  async logout(): Promise<void> {
    if (this.isBrowser && this.http) {
      try {
        await firstValueFrom(this.http.post('/api/auth/logout', {}));
      } catch {
        // Proceed with local cleanup even if server call fails
      }
    }
    this.clearAuthData();
  }

  public setLoggedInUser(user: PartnerAuthUser): void {
    if (!this.isBrowser) return;
    const enrichedUser = this.enrichUser(user);
    this.currentUserSubject.next(enrichedUser);
    if (typeof this.storage.setItem === 'function') {
      this.storage.setItem(this.USER_KEY, enrichedUser);
    }
    this.storage.setItem$(this.USER_KEY, enrichedUser).subscribe();
  }

  public clearAuthData(): void {
    this.currentUserSubject.next(null);
    if (!this.isBrowser) return;

    if (typeof this.storage.removeItem === 'function') {
      this.storage.removeItem(this.TOKEN_KEY);
      this.storage.removeItem(this.REFRESH_TOKEN_KEY);
      this.storage.removeItem(this.TOKEN_EXPIRY_KEY);
      this.storage.removeItem(this.USER_KEY);
    }

    this.storage.removeItem$(this.TOKEN_KEY).subscribe();
    this.storage.removeItem$(this.REFRESH_TOKEN_KEY).subscribe();
    this.storage.removeItem$(this.TOKEN_EXPIRY_KEY).subscribe();
    this.storage.removeItem$(this.USER_KEY).subscribe();
  }

  public async hydrateCurrentUser(): Promise<PartnerAuthUser | null> {
    if (!this.isBrowser || !this.http) return this.getCurrentUser();
    try {
      const res = await firstValueFrom(this.http.get<{ success: boolean; data?: PartnerAuthUser }>('/api/auth/me'));
      if (res?.success && res.data) {
        this.setLoggedInUser(res.data);
        return this.getCurrentUser();
      }
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 401 || status === 403) {
        this.clearAuthData();
        return null;
      }
    }
    return this.getCurrentUser();
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
