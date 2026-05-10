import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
    type ApiResponse,
    type AuthResponse,
    type InitLoginResponse,
    type LoginCredentials,
    type VerifyOtpParams,
} from '../models/auth.models';
import { type LoginApiPort } from '../tokens/login.tokens';

@Injectable({ providedIn: 'root' })
export class LoginApiService implements LoginApiPort {
    private readonly apiUrl = '/api/auth';

    constructor(@Inject(HttpClient) private readonly http: HttpClient) {}

    login(credentials: LoginCredentials): Observable<ApiResponse<AuthResponse>> {
        return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login`, credentials);
    }

    initLogin(credentials: LoginCredentials): Observable<ApiResponse<InitLoginResponse>> {
        return this.http.post<ApiResponse<InitLoginResponse>>(`${this.apiUrl}/login/init`, credentials);
    }

    verifyOtp(params: VerifyOtpParams): Observable<ApiResponse<AuthResponse>> {
        return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/verify-otp`, params);
    }

    socialLogin(provider: 'google' | 'facebook', token: string): Observable<ApiResponse<AuthResponse>> {
        return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/social/${provider}`, { token });
    }

    resendOtp(email: string): Observable<ApiResponse<{ success: boolean; message?: string }>> {
        return this.http.post<ApiResponse<{ success: boolean; message?: string }>>(
            `${this.apiUrl}/login/resend-otp`,
            { email },
        );
    }
}
