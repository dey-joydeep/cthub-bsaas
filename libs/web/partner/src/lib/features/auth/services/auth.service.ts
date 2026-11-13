import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, firstValueFrom, of } from 'rxjs';

import { StorageService } from '@cthub-bsaas/web-core-platform';
import { BYPASS_ERROR_INTERCEPTOR } from '@cthub-bsaas/web-core-common';
import type { AuthStatePort } from '@cthub-bsaas/web-core-auth';
import { hasManagerCapability } from '@cthub-bsaas/shared';
import type { PartnerAuthUser } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService implements AuthStatePort {
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly TOKEN_EXPIRY_KEY = 'token_expiry';
  private readonly USER_KEY = 'current_user';

  private readonly platformId = inject(PLATFORM_ID);
  private readonly storage = inject(StorageService);
  private readonly http = inject(HttpClient, { optional: true });

  private readonly isBrowser: boolean;
  private currentUserSubject = new BehaviorSubject<PartnerAuthUser | null>(null);
  public readonly currentUser$: Observable<PartnerAuthUser | null> = this.currentUserSubject.asObservable();
  private initPromise: Promise<PartnerAuthUser | null> | null = null;

  public sessionTtlMs = 5 * 60 * 1000;
  private lastValidatedAt = 0;
  private authGeneration = 0;
  private inFlightHydration: Promise<PartnerAuthUser | null> | null = null;

  constructor() {
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

    if (this.initPromise) {
      await this.initPromise;
    }

    const token = await firstValueFrom(this.getToken());
    if (this.isTokenValid(token)) {
      return true;
    }

    const hasUser = this.currentUserSubject.value !== null;
    if (!hasUser) {
      return false;
    }

    const isStale = Date.now() - this.lastValidatedAt >= this.sessionTtlMs;
    if (!isStale) {
      return true;
    }

    if (this.http) {
      const user = await this.hydrateCurrentUser();
      return user !== null;
    }

    return false;
  }

  async logout(): Promise<void> {
    this.authGeneration++;
    this.inFlightHydration = null;
    if (this.isBrowser && this.http) {
      try {
        await firstValueFrom(
          this.http.post(
            '/api/auth/logout',
            {},
            {
              context: new HttpContext().set(BYPASS_ERROR_INTERCEPTOR, true),
            },
          ),
        );
      } catch {
        // Proceed with local cleanup even if server call fails
      }
    }
    this.clearAuthData();
  }

  public setLoggedInUser(user: PartnerAuthUser): void {
    if (!this.isBrowser) return;
    this.lastValidatedAt = Date.now();
    const enrichedUser = this.enrichUser(user);
    this.currentUserSubject.next(enrichedUser);
    if (typeof this.storage.setItem === 'function') {
      this.storage.setItem(this.USER_KEY, enrichedUser);
    }
    this.storage.setItem$(this.USER_KEY, enrichedUser).subscribe();
  }

  public clearAuthData(): void {
    this.authGeneration++;
    this.inFlightHydration = null;
    this.lastValidatedAt = 0;
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

    if (this.inFlightHydration) {
      return this.inFlightHydration;
    }

    const requestGeneration = this.authGeneration;
    const hydrationPromise = this.performHydration(requestGeneration);
    this.inFlightHydration = hydrationPromise;

    try {
      return await hydrationPromise;
    } finally {
      if (this.inFlightHydration === hydrationPromise) {
        this.inFlightHydration = null;
      }
    }
  }

  private async performHydration(requestGeneration: number): Promise<PartnerAuthUser | null> {
    if (!this.http) return null;
    try {
      const res = await firstValueFrom(
        this.http.get<{ success: boolean; data?: PartnerAuthUser }>('/api/auth/me', {
          context: new HttpContext().set(BYPASS_ERROR_INTERCEPTOR, true),
        }),
      );

      // Ignore hydration response if logout or clear was triggered while request was in-flight
      if (requestGeneration !== this.authGeneration) {
        return null;
      }

      if (res?.success && res.data) {
        this.lastValidatedAt = Date.now();
        this.setLoggedInUser(res.data);
        return this.getCurrentUser();
      }
      this.clearAuthData();
      return null;
    } catch (err: unknown) {
      if (requestGeneration !== this.authGeneration) {
        return null;
      }
      const status = (err as { status?: number })?.status;
      if (status === 401 || status === 403) {
        this.clearAuthData();
        return null;
      }
    }

    if (requestGeneration !== this.authGeneration) {
      return null;
    }
    return this.getCurrentUser();
  }

  private enrichUser(user: PartnerAuthUser): PartnerAuthUser {
    let managedBranchIds = user.managedBranchIds;
    let canManageBranches = user.canManageBranches;
    let roles = user.roles;
    let role = user.role;

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
          roles = payload['roles'] as string[];
        }
        if (!role && typeof payload['role'] === 'string') {
          role = payload['role'];
        }
      }
    }

    if (!role && roles && roles.length > 0) {
      const lowerRoles = roles.map((r) => r.toLowerCase());
      if (lowerRoles.includes('owner')) {
        role = 'owner';
      } else if (lowerRoles.includes('admin')) {
        role = 'admin';
      } else if (lowerRoles.includes('staff')) {
        role = 'staff';
      } else {
        role = lowerRoles[0];
      }
    }

    const candidate: PartnerAuthUser = {
      ...user,
      ...(role ? { role } : {}),
      ...(roles ? { roles } : {}),
      ...(managedBranchIds ? { managedBranchIds } : {}),
      canManageBranches,
    };

    if (candidate.canManageBranches === undefined) {
      return {
        ...candidate,
        canManageBranches: hasManagerCapability(candidate),
      };
    }

    return candidate;
  }

  private getToken(): Observable<string | null> {
    if (!this.isBrowser) return of(null);
    return this.storage.getItem$<string>(this.TOKEN_KEY).pipe(catchError(() => of(null)));
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
