
# Rate Limits & Lockouts (Auth)
Updated: 2025-09-11

## Principles
- Uniform responses to avoid account enumeration.
- `Retry-After` header present on 429; FE must honor countdown.

## Suggested Limits
- POST /auth/login: 5/min per IP+email
- POST /auth/password/forgot: 3/min per IP+email (generic 202 always)
- POST /auth/mfa/totp/verify: 5/min per user
- POST /auth/email/verify/request: 3/min per email; daily cap 10
- POST /auth/register/complete: 5/min per IP
- WebAuthn verify/enroll: 5/min per user
- OTP request/confirm (partner): 3/min

## Lockouts
- After repeated failures on login/TOTP, temporary lock (e.g., 15 minutes). Server returns 423 with generic copy.
