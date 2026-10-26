/**
 * Auth feature i18n message keys grouped by semantics.
 * Use ERROR keys for exceptions and error responses, INFO/WARN reserved for future use.
 */
export const AUTH_MESSAGE_KEYS = {
  INFO: {},
  WARN: {},
  ERROR: {
    INVALID_CREDENTIALS: 'error.auth.invalid_credentials',
    INVALID_TOTP_TOKEN: 'error.auth.invalid_totp_token',
    INVALID_TOTP_CODE: 'error.auth.invalid_totp_code',
    INVALID_OR_EXPIRED_TOTP: 'error.auth.invalid_or_expired_totp',
    INVALID_REFRESH_TOKEN: 'error.auth.invalid_refresh_token',
    MISSING_REFRESH_TOKEN: 'error.auth.missing_refresh_token',
    CANNOT_REVOKE_SESSION: 'error.auth.cannot_revoke_session',
    USER_NOT_FOUND: 'error.auth.user_not_found',
    OAUTH_LINK_REQUIRED: 'error.auth.oauth_link_required',
    CANNOT_UNLINK_LAST_METHOD: 'error.auth.cannot_unlink_last_method',
    INVALID_OR_EXPIRED_RESET_TOKEN: 'error.auth.invalid_or_expired_reset_token',
    INVALID_VERIFY_TOKEN: 'error.auth.invalid_verify_token',
    INVALID_OR_EXPIRED_VERIFY_TOKEN: 'error.auth.invalid_or_expired_verify_token',
    OTP_EXPIRED: 'error.auth.otp_expired',
    INVALID_OTP: 'error.auth.invalid_otp',
    STRONG_AUTH_REQUIRED: 'error.auth.strong_auth_required',
    EMAIL_ALREADY_EXISTS: 'error.auth.email_already_exists',
    // Core-auth related
    UNAUTHENTICATED: 'error.auth.unauthenticated',
    NO_ROLES: 'error.auth.no_roles',
    INSUFFICIENT_PERMISSIONS: 'error.auth.insufficient_permissions',
    // WebAuthn device management
    PASSKEY_NOT_FOUND: 'error.auth.passkey_not_found',
  },
} as const;

export type AuthErrorMessageKey = (typeof AUTH_MESSAGE_KEYS)['ERROR'][keyof (typeof AUTH_MESSAGE_KEYS)['ERROR']];
export type AuthMessageKey = AuthErrorMessageKey;
