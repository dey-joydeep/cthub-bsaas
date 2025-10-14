// Admin auth library local models (kept app-specific for now)
// If later promoted to core, migrate these interfaces to @cthub-bsaas/web-core-auth
import type { BaseAuthUser } from '@cthub-bsaas/web-core-auth';

export interface LoginCredentials {
    readonly email: string;
    readonly password: string;
    readonly rememberMe?: boolean;
}

export interface VerifyOtpParams {
    readonly email: string;
    readonly otp: string;
    readonly type?: 'login' | 'reset' | 'verify';
}

export type AuthResponse = AdminAuthUser & {
    readonly accessToken: string;
    readonly refreshToken: string;
    readonly expiresIn: number;
};

export interface InitLoginResponse {
    readonly userType: 'owner' | 'staff' | 'customer';
    readonly token?: string;
    readonly user?: AdminAuthUser;
    readonly requiresOtp?: boolean;
}

export interface ApiResponse<T = unknown> {
    readonly data: T;
    readonly message?: string;
    readonly success: boolean;
    readonly error?: string;
    readonly statusCode?: number;
}

// Admin app specific, richer shape used by AuthService and UI
export interface AdminAuthUser extends BaseAuthUser {
    readonly email: string;
    readonly name: string;
    readonly role: string;
    readonly accessToken?: string;
    readonly refreshToken?: string;
    readonly expiresIn?: number;
}

export interface SocialLoginResponse {
    readonly token: string;
    readonly user: AdminAuthUser;
    readonly refreshToken: string;
    readonly expiresIn: number;
}

export interface PasswordResetRequest {
    readonly email: string;
}

export interface PasswordResetConfirm {
    readonly token: string;
    readonly password: string;
    readonly confirmPassword: string;
}
