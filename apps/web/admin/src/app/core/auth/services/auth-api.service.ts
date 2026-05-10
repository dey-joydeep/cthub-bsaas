import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import {
  type ApiResponse,
  type AuthResponse,
  type InitLoginResponse,
  type LoginApiPort,
  type LoginCredentials,
  type VerifyOtpParams,
} from '@cthub-bsaas/web-admin/auth';
import { environment } from '@cthub-bsaas/web-config/environments/admin/environment';

/**
 * Thin HTTP adapter that satisfies the `LOGIN_API` and password reset ports.
 * The endpoints mirror the placeholder customer flows and can be replaced once
 * real backend routes are available.
 */
@Injectable({ providedIn: 'root' })
export class AuthApiService implements LoginApiPort {
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  constructor(private readonly http: HttpClient) {}

  login(credentials: LoginCredentials): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.baseUrl}/login`, credentials);
  }

  initLogin(credentials: LoginCredentials): Observable<ApiResponse<InitLoginResponse>> {
    return this.http.post<ApiResponse<InitLoginResponse>>(`${this.baseUrl}/login/init`, credentials);
  }

  verifyOtp(params: VerifyOtpParams): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.baseUrl}/otp/verify`, params);
  }

  socialLogin(provider: 'google' | 'facebook', token: string): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.baseUrl}/social/${provider}`, { token });
  }

  requestPasswordReset(email: string): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.baseUrl}/password/forgot`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.baseUrl}/password/reset`, { token, newPassword });
  }
}
