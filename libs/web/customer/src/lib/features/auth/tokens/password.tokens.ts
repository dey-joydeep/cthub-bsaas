import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

export interface RegisterPayload {
    readonly name: string;
    readonly email: string;
    readonly password: string;
}

export interface RegisterApiPort {
    register(payload: RegisterPayload): Promise<void>;
}

export interface ForgotPasswordApiPort {
    requestPasswordReset(email: string): Observable<boolean>;
    resetPassword(token: string, newPassword: string): Observable<boolean>;
}

export const REGISTER_API = new InjectionToken<RegisterApiPort>('REGISTER_API');
export const FORGOT_PASSWORD_API = new InjectionToken<ForgotPasswordApiPort>('FORGOT_PASSWORD_API');
