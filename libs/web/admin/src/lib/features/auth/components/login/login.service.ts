import { Inject, Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

import {
    AUTH_STATE_SETTER,
    LOGIN_API,
    type ApiResponse,
    type AuthResponse,
    type AuthStateSetter,
    type AdminAuthUser,
    type InitLoginResponse,
    type LoginApiPort,
    type LoginCredentials,
    type VerifyOtpParams,
} from '../../tokens/login.tokens';

@Injectable({ providedIn: 'root' })
export class LoginService {
    constructor(
        @Inject(LOGIN_API) private readonly api: LoginApiPort,
        @Inject(AUTH_STATE_SETTER) private readonly authState: AuthStateSetter,
    ) { }

    initLogin(credentials: LoginCredentials): Observable<InitLoginResponse> {
        return this.api.initLogin(credentials).pipe(
            map((res) => {
                if (!res.success) throw new Error(res.error || 'Login initialization failed');
                return res.data;
            }),
        );
    }

    login(credentials: LoginCredentials): Observable<AdminAuthUser> {
        return this.api.login(credentials).pipe(
            map((res) => this.handleAuthResponse(res)),
            catchError((err) => this.forwardError(err)),
        );
    }

    verifyOtp(params: VerifyOtpParams): Observable<AdminAuthUser> {
        return this.api.verifyOtp(params).pipe(
            map((res) => this.handleAuthResponse(res)),
            catchError((err) => this.forwardError(err)),
        );
    }

    socialLogin(provider: 'google' | 'facebook', token: string): Observable<AdminAuthUser> {
        return this.api.socialLogin(provider, token).pipe(
            map((res) => this.handleAuthResponse(res)),
            catchError((err) => this.forwardError(err)),
        );
    }

    private handleAuthResponse(res: ApiResponse<AuthResponse>): AdminAuthUser {
        if (!res.success) throw new Error(res.error || 'Authentication failed');
        const user = { ...res.data } as AdminAuthUser;
        this.authState.setLoggedInUser(user);
        return user;
    }

    private forwardError(err: any) {
        const message = err?.error?.message || err?.message || 'Authentication error';
        return throwError(() => new Error(message));
    }
}
