import { Inject, Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

import {
  AUTH_STATE_SETTER,
  LOGIN_API,
  type ApiResponse,
  type AuthResponse,
  type InitLoginResponse,
  type LoginCredentials,
  type PartnerAuthUser,
  type VerifyOtpParams,
} from '../../tokens/login.tokens';

type LoginApi = {
  login(credentials: LoginCredentials): Observable<ApiResponse<AuthResponse>>;
  initLogin(credentials: LoginCredentials): Observable<ApiResponse<InitLoginResponse>>;
  verifyOtp(params: VerifyOtpParams): Observable<ApiResponse<AuthResponse>>;
  socialLogin(provider: 'google' | 'facebook', token: string): Observable<ApiResponse<AuthResponse>>;
  resendOtp(email: string): Observable<ApiResponse<{ success: boolean; message?: string }>>;
};

type AuthStateSetterPort = {
  setLoggedInUser(user: PartnerAuthUser): void;
};

@Injectable({ providedIn: 'root' })
export class LoginService {
  constructor(
    @Inject(LOGIN_API) private readonly api: LoginApi,
    @Inject(AUTH_STATE_SETTER) private readonly authState: AuthStateSetterPort,
  ) {}

  initLogin(credentials: LoginCredentials): Observable<InitLoginResponse> {
    return this.api.initLogin(credentials).pipe(
      map((res) => {
        if (!res.success) throw new Error(res.error || 'Login initialization failed');
        return res.data;
      }),
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

  resendOtp(email: string) {
    return this.api.resendOtp(email).pipe(
      map((res) => {
        if (!res.success) throw new Error(res.error || 'Failed to resend OTP');
        return res.data;
      }),
    );
  }

  private handleAuthResponse(res: ApiResponse<AuthResponse>): PartnerAuthUser {
    if (!res.success) throw new Error(res.error || 'Authentication failed');
    const data = res.data as Record<string, unknown> | undefined;
    const source =
      data && typeof data === 'object' && 'user' in data && data['user'] ? (data['user'] as Record<string, unknown>) : (data ?? {});
    const user = { ...source } as PartnerAuthUser;
    this.authState.setLoggedInUser(user);
    return user;
  }

  private forwardError(err: any) {
    const message = err?.error?.message || err?.message || 'Authentication error';
    return throwError(() => new Error(message));
  }
}
