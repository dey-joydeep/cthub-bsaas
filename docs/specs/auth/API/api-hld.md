# Auth API - High-Level Design (HLD)
**Status:** Authoritative overview; `openapi.yaml` is the route/source contract  
**Updated:** 2026-05-02  
**Locales:** en/bn/hi

## 1) Purpose & Scope
This HLD defines the Auth API capabilities for CTHub:

- Sign-in with email/password and optional MFA challenge.
- TOTP and WebAuthn/passkey authentication.
- Password reset and password change.
- Refresh, logout, session list, and session revoke.
- Recovery code generation and verification.
- Email verification and email change.
- OAuth start/callback/unlink.
- Customer self-registration.
- Partner owner/staff invite validation and completion.

For exact paths, methods, request bodies, response schemas, and status codes, use `docs/specs/auth/API/openapi.yaml`.

## 2) Source Of Truth
The current API contract is:

- `openapi.yaml`: external HTTP contract.
- Controllers under `libs/server/features/auth/src/lib/controllers`: implementation.
- `scripts/openapi-auth-check.ts`: route parity check between controllers and OpenAPI.

Do not add routes that are absent from OpenAPI unless a new API migration plan is approved and implemented with tests.

## 3) Response Envelopes
Success responses are normalized as:

```json
{
  "success": true,
  "data": {}
}
```

Error responses are normalized as:

```json
{
  "success": false,
  "code": "error.auth.invalid_credentials",
  "message": "error.auth.invalid_credentials",
  "details": {},
  "meta": {
    "correlationId": "c-01HZZ..."
  }
}
```

Success responses rely on the `X-Correlation-Id` response header. Error responses include `meta.correlationId`.

## 4) Cross-Cutting Rules
- **Cookies:** HttpOnly access/refresh cookies: `bsaas_at`, `bsaas_rt`; non-HttpOnly CSRF cookie: `XSRF-TOKEN`.
- **Cookie flags:** `HttpOnly` for access/refresh; `Secure` in production; `SameSite=Lax`; configurable domain via `AUTH_COOKIE_DOMAIN`. Access path is `/`; refresh path is `/auth`.
- **Refresh token source:** refresh reads `bsaas_rt`; a body token is accepted only when the cookie is absent. Supplying both cookie and body token is a `400`.
- **CSRF/XSRF:** double-submit token; frontend sends `X-XSRF-TOKEN` for protected state-changing requests.
- **Rate limiting:** sensitive endpoints return `429` with `Retry-After`.
- **Enumeration resistance:** email/password/reset/verification flows use generic responses where needed.
- **Correlation ID:** emitted as `X-Correlation-Id`, included in error envelopes, and used in logs/audit context.

## 5) Current Route Surface

### Authentication And Sessions
- `POST /auth/login`
- `POST /auth/login/totp`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/sessions`
- `POST /auth/sessions/revoke/{id}`

### Passwords And Email
- `POST /auth/password/forgot`
- `POST /auth/password/reset`
- `POST /auth/password/change`
- `POST /auth/email/change/request`
- `POST /auth/email/change/confirm`
- `POST /auth/email/verify/request`
- `POST /auth/email/verify/confirm`

### Recovery, TOTP, WebAuthn, Passkeys
- `POST /auth/recovery/generate`
- `POST /auth/recovery/verify`
- `POST /auth/totp/enroll/start`
- `POST /auth/totp/enroll/finish`
- `POST /auth/webauthn/register/start`
- `POST /auth/webauthn/register/finish`
- `POST /auth/webauthn/login/start`
- `POST /auth/webauthn/login/finish`
- `GET /auth/webauthn/devices`
- `DELETE /auth/webauthn/devices/{id}`

### OAuth
- `GET /auth/oauth/{provider}/start`
- `GET /auth/oauth/{provider}/callback`
- `POST /auth/oauth/{provider}/unlink`

### Registration
- `POST /auth/register`
- `GET /auth/owner/registration/{token}`
- `POST /auth/owner/registration/complete`
- `GET /auth/staff/registration/{token}`
- `POST /auth/staff/registration/complete`

## 6) Representative Contracts

### Login
`POST /auth/login`

Request:

```json
{
  "email": "user@example.com",
  "password": "S3curePass!"
}
```

Typical success response:

```json
{
  "success": true,
  "data": {
    "next": "signedIn"
  }
}
```

If TOTP is required, the login response returns a temporary challenge token used with `POST /auth/login/totp`.

### TOTP Login Challenge
`POST /auth/login/totp`

Request:

```json
{
  "tempToken": "tmp_abc",
  "totpCode": "123456"
}
```

### Refresh
`POST /auth/refresh`

The refresh token is read from cookie `bsaas_rt`. A body refresh token is accepted only when the cookie is absent. Providing both is rejected with `400`.

### Customer Registration
`POST /auth/register`

Request:

```json
{
  "email": "user@example.com",
  "password": "S3curePass!",
  "name": "A B"
}
```

Successful customer registration returns `201` and issues auth cookies.

### Partner Registration Completion
`POST /auth/owner/registration/complete` and `POST /auth/staff/registration/complete`

Successful completion returns `201`.

## 7) Status Code Policy
- `200`: OK.
- `201`: created, including customer/partner registration completion.
- `202`: accepted/idempotent email-dispatch flows.
- `400`: malformed or conflicting request.
- `401`: unauthenticated or invalid credential/session ownership.
- `403`: forbidden or CSRF failure.
- `410`: expired one-time token/challenge.
- `422`: validation, invalid OTP/assertion, or semantic failure.
- `429`: rate limited; include `Retry-After`.
- `500`: unexpected server failure; log correlation ID.

## 8) Traceability
- API contract: `docs/specs/auth/API/openapi.yaml`
- Error catalog: `docs/specs/auth/API/error-catalog.md`
- Frontend service summary: `docs/specs/auth/API/fe-service-contracts.md`
- Contract parity script: `scripts/openapi-auth-check.ts`
