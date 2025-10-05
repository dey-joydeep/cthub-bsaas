import type { BaseAuthUser } from '@cthub-bsaas/web-core-auth';

export interface CustomerAuthUser extends BaseAuthUser {
    readonly email: string;
    readonly name: string;
    readonly role: string;
    readonly accessToken?: string;
    readonly refreshToken?: string;
    readonly expiresIn?: number;
}

export interface AuthResponse extends Omit<CustomerAuthUser, 'accessToken' | 'refreshToken' | 'expiresIn'> {
    readonly accessToken: string;
    readonly refreshToken: string;
    readonly expiresIn: number;
}

export interface InitLoginResponse {
    readonly userType: 'owner' | 'staff' | 'customer';
    readonly token?: string;
    readonly user?: CustomerAuthUser;
    readonly requiresOtp?: boolean;
}

export interface LoginCredentials {
    readonly email: string;
    readonly password: string;
    readonly rememberMe?: boolean;
}

export type VerifyOtpType = 'login' | 'reset' | 'verify';

export interface VerifyOtpParams {
    readonly email: string;
    readonly otp: string;
    readonly type?: VerifyOtpType;
}

export interface ApiResponse<T = unknown> {
    readonly data: T;
    readonly message?: string;
    readonly success: boolean;
    readonly error?: string;
    readonly statusCode?: number;
}
