# Auth API - Low-Level Design (LLD)
**Updated:** 2026-05-02

## 1) Module Structure
- **Controllers:** login/session, password, registration, email, recovery, TOTP, WebAuthn/passkeys, OAuth.
- **Services:** credential verification, token/session rotation, recovery code management, WebAuthn challenge/verification, TOTP enrollment/login, registration completion, email flows, OAuth.
- **Filters/interceptors:** success envelope, canonical error envelope, 429 `Retry-After`, `Cache-Control: no-store`, correlation ID header and error metadata.

Exact paths and schemas are defined in `openapi.yaml`.

## 2) Authentication Flow

### Password Login
1. Validate `LoginDto` with `email` and `password`.
2. Verify account and password using uniform error behavior for credential failure.
3. If no MFA challenge is required, issue cookies and return `200`.
4. If TOTP is required, return a temporary token and require `POST /auth/login/totp`.

### TOTP Login Challenge
Endpoint: `POST /auth/login/totp`

Request schema: `TotpLoginDto`

- `tempToken`: temporary challenge token.
- `totpCode`: 6-digit TOTP code.

Outcomes:

- `200`: challenge accepted, cookies issued.
- `410`: challenge expired.
- `422`: invalid TOTP.
- `429`: too many attempts, with `Retry-After`.

## 3) Session Flow

### Refresh
Endpoint: `POST /auth/refresh`

- Primary token source is the HttpOnly `bsaas_rt` cookie.
- Body `refreshToken` is accepted only when the cookie is absent.
- Supplying both cookie and body refresh tokens is a `400`.
- On success, refresh token is rotated, access token is renewed, and `XSRF-TOKEN` is rotated.
- Reuse of a revoked refresh token is denied and attempts session revocation/audit handling.

### Logout And Revoke
- `POST /auth/logout`: clears access/refresh cookies.
- `GET /auth/sessions`: lists active sessions.
- `POST /auth/sessions/revoke/{id}`: revokes a specific session.

## 4) Password And Email Flows

### Password Reset
- `POST /auth/password/forgot`: accepts `{ email }`, returns `202` using anti-enumeration behavior.
- `POST /auth/password/reset`: accepts `{ token, newPassword }`.

### Password Change
- `POST /auth/password/change`: authenticated password change with CSRF protection.

### Email Change
- `POST /auth/email/change/request`: accepts `{ newEmail }`, returns `202`.
- `POST /auth/email/change/confirm`: accepts `{ token }`.

### Email Verification
- `POST /auth/email/verify/request`: accepts `{ email }`, returns `202`.
- `POST /auth/email/verify/confirm`: accepts either `{ token }` or `{ email, otp }`.

## 5) Registration Flows

### Customer
Endpoint: `POST /auth/register`

Request:

- `email`
- `password`
- `name`

Successful registration returns `201` and issues cookies/XSRF.

### Partner Owner/Staff
- `GET /auth/owner/registration/{token}`
- `POST /auth/owner/registration/complete`
- `GET /auth/staff/registration/{token}`
- `POST /auth/staff/registration/complete`

Successful completion returns `201`.

## 6) Recovery, TOTP Enrollment, WebAuthn

### Recovery Codes
- `POST /auth/recovery/generate`: generates recovery codes; current contract returns `200`.
- `POST /auth/recovery/verify`: verifies and consumes a recovery code.

Recovery codes are persisted hashed in the database.

### TOTP Enrollment
- `POST /auth/totp/enroll/start`
- `POST /auth/totp/enroll/finish`

### WebAuthn And Passkeys
- `POST /auth/webauthn/register/start`
- `POST /auth/webauthn/register/finish`
- `POST /auth/webauthn/login/start`
- `POST /auth/webauthn/login/finish`
- `GET /auth/webauthn/devices`
- `DELETE /auth/webauthn/devices/{id}`

## 7) OAuth
- `GET /auth/oauth/{provider}/start`: begins provider login/link flow.
- `GET /auth/oauth/{provider}/callback`: callback returns `200` in the current contract.
- `POST /auth/oauth/{provider}/unlink`: unlinks provider for authenticated user.

## 8) DTO Summary
- `LoginDto`: `email`, `password`.
- `RefreshDto`: optional `refreshToken`, only used when `bsaas_rt` cookie is absent.
- `ForgotDto`: `email`.
- `ResetDto`: `token`, `newPassword`.
- `PasswordChangeDto`: `currentPassword`, `newPassword`.
- `EmailChangeRequestDto`: `newEmail`.
- `EmailChangeConfirmDto`: `token`.
- `EmailVerifyRequestDto`: `email`.
- `EmailVerifyConfirmDto`: `token` OR `email` + `otp`.
- `TotpLoginDto`: `tempToken`, `totpCode`.
- `PartnerRegistrationCompleteDto`: `token`, `password`.
- `WebauthnRegisterStartDto`: `username`.
- `WebauthnAttestationDto`: `response`.
- `WebauthnAssertionDto`: `response`.

## 9) Response Envelope And Errors
- Non-redirect success responses are wrapped as `{ success: true, data }`.
- Errors are wrapped as `{ success: false, code, message, details?, meta?: { correlationId } }`.
- `X-Correlation-Id` is emitted for all responses.
- Error envelopes include `meta.correlationId`.

Current status semantics:

- `400`: malformed/conflicting request.
- `401`: invalid credentials/session/ownership.
- `403`: forbidden or CSRF failure.
- `410`: expired one-time token/challenge.
- `422`: validation or invalid OTP/assertion.
- `429`: throttled, with `Retry-After`.

## 10) Testing Strategy
- **Unit:** controller/service branches, DTO behavior, token/session edge cases, cookie behavior.
- **Integration:** cookie rotation, refresh reuse detection, CSRF behavior, recovery/passkey/TOTP/OAuth edge cases.
- **Contract:** `scripts/openapi-auth-check.ts` validates controller route parity against `openapi.yaml`.
- **OpenAPI lint:** Redocly validates `openapi.yaml`.
