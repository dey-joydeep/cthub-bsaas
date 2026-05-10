
# Auth API Error Catalog
Updated: 2026-05-02

| Code | HTTP | Meaning | FE i18n key | Retry / UX |
|---|---|---|---|---|
| INVALID_CREDENTIALS | 401 | Email or password incorrect | auth.errors.invalidCredentials | Shake form; focus email; allow retry |
| RATE_LIMITED | 429 | Too many attempts | auth.errors.rateLimited | Respect `Retry-After`; disable submit |
| TOKEN_INVALID | 400 | Token malformed/unknown | auth.errors.tokenInvalid | Generic error; restart flow |
| TOKEN_EXPIRED | 410 | Token expired | auth.errors.tokenExpired | Offer resend |
| TOTP_INVALID | 401 | Wrong 2FA code | auth.errors.totpInvalid | Focus OTP; allow retry |
| PASSKEY_ASSERTION_FAILED | 401 | WebAuthn failed | auth.errors.passkey | Offer password fallback |
| SESSION_INVALID | 400 | Session state invalid | auth.errors.sessionInvalid | Restart from first step |
| OTP_INVALID | 400 | Wrong OTP | auth.errors.otpInvalid | Allow retry |
| OTP_EXPIRED | 410 | OTP expired | auth.errors.otpExpired | Offer resend |
| WEAK_PASSWORD | 400 | Password below policy | auth.errors.weakPassword | Show meter hints |
