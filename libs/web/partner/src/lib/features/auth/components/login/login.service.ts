import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

import {
  AUTH_STATE_SETTER,
  LOGIN_API,
  type ApiResponse,
  type AuthResponse,
  type AuthStateSetter,
  type InitLoginResponse,
  type LoginApiPort,
  type LoginCredentials,
  type PartnerAuthUser,
  type VerifyOtpParams,
} from '../../tokens/login.tokens';

@Injectable({ providedIn: 'root' })
export class LoginService {
  private readonly api = inject<LoginApiPort>(LOGIN_API);
  private readonly authState = inject<AuthStateSetter>(AUTH_STATE_SETTER);

  initLogin(credentials: LoginCredentials): Observable<InitLoginResponse> {
    return this.api.initLogin(credentials).pipe(
      map((res) => {
        if (!res.success || !res.data) throw new Error(res.error || 'Failed to initialize login');
        return res.data;
      }),
      catchError((err) => this.forwardError(err)),
    );
  }

  login(credentials: LoginCredentials): Observable<PartnerAuthUser> {
    return this.api.login(credentials).pipe(
      map((res) => this.handleAuthResponse(res)),
      catchError((err) => this.forwardError(err)),
    );
  }

  verifyOtp(params: VerifyOtpParams): Observable<PartnerAuthUser> {
    return this.api.verifyOtp(params).pipe(
      map((res) => this.handleAuthResponse(res)),
      catchError((err) => this.forwardError(err)),
    );
  }

  socialLogin(provider: 'google' | 'facebook', token: string): Observable<PartnerAuthUser> {
    return this.api.socialLogin(provider, token).pipe(
      map((res) => this.handleAuthResponse(res)),
      catchError((err) => this.forwardError(err)),
    );
  }

  resendOtp(email: string): Observable<{ success: boolean; message?: string }> {
    return this.api.resendOtp(email).pipe(
      map((res) => {
        if (!res.success) throw new Error(res.error || 'Failed to resend OTP');
        return { success: true, message: res.message };
      }),
      catchError((err) => this.forwardError(err)),
    );
  }

  private handleAuthResponse(res: ApiResponse<AuthResponse>): PartnerAuthUser {
    if (!res.success) {
      throw new Error(res.error || 'Authentication failed');
    }
    const data = res.data as Record<string, unknown> | undefined;
    const source =
      data && typeof data === 'object' && 'user' in data && data['user'] ? (data['user'] as Record<string, unknown>) : (data ?? {});
    const user = { ...source } as PartnerAuthUser;
    this.authState.setLoggedInUser(user);
    return user;
  }

  private forwardError(err: unknown): Observable<never> {
    return throwError(() => err);
  }
}
