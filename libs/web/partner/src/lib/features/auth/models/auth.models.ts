// Partner auth library local models (app-specific)
// If promoted to core later, migrate to @cthub-bsaas/web-core-auth
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

export type AuthResponse = PartnerAuthUser & {
    readonly accessToken: string;
    readonly refreshToken: string;
    readonly expiresIn: number;
};

export interface InitLoginResponse {
    readonly userType: 'owner' | 'staff' | 'customer';
    readonly token?: string;
    readonly user?: PartnerAuthUser;
    readonly requiresOtp?: boolean;
}

export interface ApiResponse<T = unknown> {
    readonly data: T;
    readonly message?: string;
    readonly success: boolean;
    readonly error?: string;
    readonly statusCode?: number;
}

// Partner app specific, richer shape used by AuthService and UI
export interface PartnerAuthUser extends BaseAuthUser {
    readonly email: string;
    readonly name: string;
    readonly role: string;
    readonly accessToken?: string;
    readonly refreshToken?: string;
    readonly expiresIn?: number;
}

export interface SocialLoginResponse {
    readonly token: string;
    readonly user: PartnerAuthUser;
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
