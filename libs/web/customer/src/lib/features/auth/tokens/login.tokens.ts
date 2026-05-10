import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import type {
    ApiResponse,
    AuthResponse,
    CustomerAuthUser,
    InitLoginResponse,
    LoginCredentials,
    VerifyOtpParams,
} from '../models/auth.models';

// Re-export model types for consumers importing from tokens
export type {
    ApiResponse,
    AuthResponse,
    CustomerAuthUser,
    InitLoginResponse,
    LoginCredentials,
    VerifyOtpParams,
} from '../models/auth.models';

export interface LoginApiPort {
    login(credentials: LoginCredentials): Observable<ApiResponse<AuthResponse>>;
    initLogin(credentials: LoginCredentials): Observable<ApiResponse<InitLoginResponse>>;
    verifyOtp(params: VerifyOtpParams): Observable<ApiResponse<AuthResponse>>;
    socialLogin(provider: 'google' | 'facebook', token: string): Observable<ApiResponse<AuthResponse>>;
    resendOtp(email: string): Observable<ApiResponse<{ success: boolean; message?: string }>>;
}

export interface AuthStateSetter {
    setLoggedInUser(user: CustomerAuthUser): void;
}

export const LOGIN_API = new InjectionToken<LoginApiPort>('LOGIN_API');
export const AUTH_STATE_SETTER = new InjectionToken<AuthStateSetter>('AUTH_STATE_SETTER');
