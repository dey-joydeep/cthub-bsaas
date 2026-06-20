import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { StorageService } from '@cthub-bsaas/web-core-platform';
import type { AuthStatePort } from '@cthub-bsaas/web-core/auth';
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

  getCurrentUser(): { readonly id: string } | null {
    const user = this.currentUserSubject.value;
    return user ? { id: user.id } : null;
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
    this.currentUserSubject.next(user);
    this.storage.setItem$(this.USER_KEY, user).subscribe();
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
          this.currentUserSubject.next(user);
        }
      },
      error: () => this.clearAuthData(),
    });
  }

  private getToken(): Observable<string | null> {
    if (!this.isBrowser) return of(null);
    return this.storage.getItem$<string>(this.TOKEN_KEY).pipe(
      map((token): string | null => (typeof token === 'string' ? token : null)),
      catchError(() => of<string | null>(null))
    );
  }

  private isTokenValid(token: string | null | undefined): boolean {
    if (!token) return false;

    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return false;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }
}
