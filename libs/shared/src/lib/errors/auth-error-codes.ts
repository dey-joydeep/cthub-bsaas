/**
 * Auth feature error codes for i18n mapping.
 * Keys are CAPITAL_SNAKE_CASE; values are the canonical string codes emitted by the API.
 *
 * Usage (web): map codes to localized messages using these constants.
 */
export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'error.auth.invalid_credentials',
  INVALID_TOTP_TOKEN: 'error.auth.invalid_totp_token',
  INVALID_TOTP_CODE: 'error.auth.invalid_totp_code',
  INVALID_OR_EXPIRED_TOTP: 'error.auth.invalid_or_expired_totp',
  INVALID_REFRESH_TOKEN: 'error.auth.invalid_refresh_token',
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
} as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];
