# Rate Limits And Lockouts (Auth)
Updated: 2026-05-02

## Principles
- Uniform responses where needed to avoid account enumeration.
- `Retry-After` is present on `429`; frontend must honor the countdown.
- Current Auth OpenAPI uses `429` for throttling.

## Current Endpoint Groups
- `POST /auth/login`: credential attempts by IP + email.
- `POST /auth/login/totp`: TOTP challenge attempts by temporary challenge/user.
- `POST /auth/password/forgot`: password reset request by IP + email.
- `POST /auth/email/verify/request`: email verification resend by email/IP.
- `POST /auth/register`: customer registration by IP + email.
- `POST /auth/totp/enroll/start`: authenticated enrollment start by user.
- `POST /auth/totp/enroll/finish`: authenticated enrollment finish by user.
- `POST /auth/webauthn/register/start`: authenticated WebAuthn registration start by user.
- `POST /auth/webauthn/register/finish`: authenticated WebAuthn registration finish by user.
- `POST /auth/webauthn/login/start`: WebAuthn login start by IP + identity.
- `POST /auth/webauthn/login/finish`: WebAuthn login finish by challenge.

## Suggested Limits
Exact limits may be environment-configured, but the frontend contract is stable:

- On throttle, server returns `429`.
- Server includes `Retry-After` in seconds.
- Frontend disables retry actions until the timer expires.
