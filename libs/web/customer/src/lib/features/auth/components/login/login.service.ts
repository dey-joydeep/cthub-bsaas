import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { AUTH_STATE_SETTER, LOGIN_API } from '../../tokens/login.tokens';
import type {
    ApiResponse,
    AuthResponse,
    CustomerAuthUser,
    InitLoginResponse,
    LoginCredentials,
    VerifyOtpParams,
} from '../../models/auth.models';

type LoginApi = {
    login(credentials: LoginCredentials): Observable<ApiResponse<AuthResponse>>;
    initLogin(credentials: LoginCredentials): Observable<ApiResponse<InitLoginResponse>>;
    verifyOtp(params: VerifyOtpParams): Observable<ApiResponse<AuthResponse>>;
    socialLogin(provider: 'google' | 'facebook', token: string): Observable<ApiResponse<AuthResponse>>;
    resendOtp(email: string): Observable<ApiResponse<{ success: boolean; message?: string }>>;
};

type AuthStateSetterPort = {
    setLoggedInUser(user: CustomerAuthUser): void;
};

@Injectable({ providedIn: 'root' })
export class LoginService {
    constructor(
        @Inject(LOGIN_API) private readonly api: LoginApi,
        @Inject(AUTH_STATE_SETTER) private readonly authState: AuthStateSetterPort,
    ) {}

    initLogin(credentials: LoginCredentials): Observable<InitLoginResponse> {
        return this.api.initLogin(credentials).pipe(map((res) => res.data));
    }

    login(credentials: LoginCredentials): Observable<CustomerAuthUser> {
        return this.api.login(credentials).pipe(map((res) => this.handleAuth(res)));
    }

    verifyOtp(params: VerifyOtpParams): Observable<CustomerAuthUser> {
        return this.api.verifyOtp(params).pipe(map((res) => this.handleAuth(res)));
    }

    socialLogin(provider: 'google' | 'facebook', token: string): Observable<CustomerAuthUser> {
        return this.api.socialLogin(provider, token).pipe(map((res) => this.handleAuth(res)));
    }

    resendOtp(email: string): Observable<{ success: boolean; message?: string }> {
        return this.api.resendOtp(email).pipe(map((res) => res.data));
    }

    private handleAuth(res: ApiResponse<AuthResponse>): CustomerAuthUser {
        const user: CustomerAuthUser = res.data;
        this.authState.setLoggedInUser(user);
        return user;
    }
}
