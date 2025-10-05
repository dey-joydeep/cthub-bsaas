import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { StorageService } from '@cthub-bsaas/web-core/http';
import type { AuthStatePort, BaseAuthUser } from '@cthub-bsaas/web-core/auth';
import type { CustomerAuthUser } from '@cthub-bsaas/web-customer-auth';

@Injectable({ providedIn: 'root' })
export class AuthService implements AuthStatePort {
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly TOKEN_EXPIRY_KEY = 'token_expiry';
  private readonly USER_KEY = 'current_user';

  private readonly isBrowser: boolean;
  private currentUserSubject = new BehaviorSubject<CustomerAuthUser | null>(null);
  public readonly currentUser$: Observable<CustomerAuthUser | null> = this.currentUserSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: object, private storage: StorageService) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.initializeAuthState();
    }
  }

  getCurrentUser(): BaseAuthUser | null {
    const u = this.currentUserSubject.value;
    return u ? { id: u.id } : null;
  }

  async isAuthenticated(): Promise<boolean> {
    if (!this.isBrowser) return false;
    const token = await firstValueFrom(this.getToken());
    return this.isTokenValid(token);
  }

  public setLoggedInUser(user: CustomerAuthUser): void {
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
    this.storage.getItem$<CustomerAuthUser>(this.USER_KEY).subscribe({
      next: (user: CustomerAuthUser | null) => {
        if (user) this.currentUserSubject.next(user);
      },
      error: () => this.clearAuthData(),
    });
  }

  private getToken(): Observable<string | null> {
    if (!this.isBrowser) return of(null);
    return this.storage.getItem$<string>(this.TOKEN_KEY).pipe(catchError(() => of(null)));
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
