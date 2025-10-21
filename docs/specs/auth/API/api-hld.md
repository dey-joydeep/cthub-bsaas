# Auth API — High‑Level Design (HLD)
**Status:** Authoritative (integrated with Registration)  
**Updated:** 2025-09-11  
**Locales:** en/bn/hi

## 1) Purpose & Scope
This HLD defines the **Auth API** surface for CTHub covering:
- Sign‑in (email+password) and MFA (TOTP/WebAuthn/passkeys, recovery codes)
- Password reset & password change
- Sessions/devices management (refresh, logout, logout-others, list, revoke)
- Email change (request/confirm)
- Social OAuth (Google required; Facebook/Apple optional; link/unlink)
- **Registration**: Customer (self‑serve) & Partner (Owner/Staff invited)

## 2) Response Envelopes (Canonical)
- **Success**
```json
{
  "success": true,
  "data": {}
}
```
- **Error**
```json
{
  "success": false,
  "code": "auth.error.generic",
  "message": "Human readable message (localized on FE)",
  "details": [
    { "field": "email", "reason": "invalidFormat" }
  ],
  "meta": { "correlationId": "c-01HZZ..." }
}
```

## 3) Cross‑Cutting
- **Cookies:** HttpOnly Access/Refresh cookies (`bsaas_at`, `bsaas_rt`) + non‑HttpOnly `XSRF-TOKEN`  
  Flags → `HttpOnly` (AT/RT), `Secure`, `SameSite=Lax`, `Path=/`, `Domain=.cthub.in` (via `AUTH_COOKIE_DOMAIN`).  
  TTLs → Access: **10–15m**; Refresh: **14–30d**, **rotation** enabled (deny‑list old `jti`).
- **CSRF/XSRF:** Double‑submit; FE sends `X-XSRF-TOKEN` header on state‑changing requests.
- **Rate limiting:** Sensitive endpoints (login, OTP/TOTP issue/verify, email verify request). Return **429** with **`Retry-After`**.
- **Enumeration resistance:** Generic 202/200 responses for “email sent/ok” cases; uniform error copy & timing.
- **Audit/Telemetry:** login/logout/refresh, MFA enroll/verify, passkey attestation/assertion, recovery issue/verify, reset, email verify/change, OAuth link/unlink, registration milestones. Emit `correlationId` on all events.
- **Adapters (Env‑switchable):**
  - WebAuthn: challenge store via `WEB_AUTHN_CHALLENGE_STORE` = `redis` (default) or `memory`; TTL via `WEB_AUTHN_CHALLENGE_TTL`. Tests provide a stub via TestingModule overrides (no prod stub binding).
  - OAuth: `OAUTH_ADAPTER` = `dev` (default), `google`, or `meta`.

## 4) HTTP Status Legend (Authoritative)
- **200**: OK / next step provided
- **201**: resource created (e.g., recovery codes)
- **202**: accepted (email dispatched / idempotent “sent”)
- **400**: malformed / missing fields
- **401**: auth failure / wrong user or session
- **403**: forbidden / CSRF violation (e.g., refresh misuse)
- **404**: not found (device/session/record)
- **410**: expired link/challenge/token (one‑time)
- **422**: validation error / invalid OTP/assertion
- **429**: rate limited / attempts exhausted / cooldown (**include `Retry-After`**)
- **500**: unexpected (log `correlationId`)

## 5) Capability Surface (by domain)
- **Authentication:** `POST /auth/login`, `POST /auth/mfa/totp/verify`, WebAuthn assertion (options/result)
- **Credential Recovery:** `POST /auth/password/reset/request`, `POST /auth/password/reset/confirm`
- **Account Security:** Recovery codes (issue/list/verify), sessions (refresh/logout/logout‑others/list/revoke), email change (request/confirm), passkeys (attestation/assertion; manage), password change
- **Registration (Customer):** start, email verify request/confirm, complete
- **Registration (Partner):** Owner/Staff invite validate & complete; OTP request/confirm
- **Social OAuth (Customer):** start/callback, link/unlink

## 6) Representative Contracts (JSON Samples)

### Sign‑in (Email + Password)
**POST** `/auth/login` → 200, 401, 422, 429, 500

Request
```json
{
  "email": "user@example.com",
  "password": "S3curePass!"
}
```

Response — 200 (no MFA)
```json
{
  "success": true,
  "data": {
    "next": "signedIn",
    "user": { "id": "u_123", "email": "user@example.com", "fullName": "A B" }
  }
}
```

Response — 200 (MFA required)
```json
{
  "success": true,
  "data": {
    "next": "mfa",
    "methods": ["webauthn", "totp", "recovery"],
    "mfa": { "challengeId": "ch_abc", "allowed": "totp|webauthn|recovery" }
  }
}
```

### MFA — TOTP Verify
**POST** `/auth/mfa/totp/verify` → 200, 400, 401, 410, 422, 429, 500

Request
```json
{ "challengeId": "ch_abc", "code": "123456" }
```

Response — 200
```json
{ "success": true, "data": { "next": "signedIn" } }
```

### MFA — Passkey (WebAuthn) Assertion
**POST** `/auth/mfa/webauthn/assertion/options` → 200, 401, 429, 500  
**POST** `/auth/mfa/webauthn/assertion/result`  → 200, 400, 401, 410, 422, 429, 500

options — 200
```json
{
  "success": true,
  "data": {
    "publicKey": {
      "challenge": "base64url-challenge",
      "rpId": "cthub.in",
      "allowCredentials": [{ "type": "public-key", "id": "base64url-cred-id" }],
      "timeout": 60000,
      "userVerification": "preferred"
    },
    "challengeId": "ch_abc"
  }
}
```

result — 200
```json
{ "success": true, "data": { "next": "signedIn" } }
```

### Recovery Codes
**POST** `/auth/recovery-codes/issue` → 201, 401, 429, 500
```json
{ "success": true, "data": { "codes": ["abcd-efgh-ijkl","mnop-qrst-uvwx","yz12-3456-7890"] } }
```

**POST** `/auth/recovery-codes/verify` → 200, 401, 422, 429, 500
```json
{ "success": true, "data": { "verified": true } }
```

### Sessions / Devices
**POST** `/auth/refresh` → 200, 401, 403, 429, 500  
**POST** `/auth/logout` → 200, 401, 500  
**POST** `/auth/logout-others` → 200, 401, 500  
**GET** `/auth/sessions` → 200, 401, 500  
**DELETE** `/auth/sessions/{id}` → 200, 401, 404, 500  
Aliases (deprecated): `GET /auth/devices`, `POST /auth/devices/revoke`

### Password Reset
**POST** `/auth/password/reset/request` → 202, 429, 500
```json
{ "email": "user@example.com" }
```

**POST** `/auth/password/reset/confirm` → 200, 400, 410, 422, 429, 500
```json
{ "token": "reset_abc", "newPassword": "N3wS3curePass!" }
```

### Email Change
**POST** `/auth/email/change/request` → 202, 401, 429, 500
```json
{ "newEmail": "new@example.com" }
```
**POST** `/auth/email/change/confirm` → 200, 400, 410, 422, 401, 429, 500
```json
{ "otp": "654321" }
```

### Social (Customer)
**GET** `/auth/oauth/{{provider}}/start` → 302 to provider  
**GET** `/auth/oauth/{{provider}}/callback` → 302 to app on success or 200 (link)  
**DELETE** `/auth/oauth/{{provider}}` → 200, 401, 409, 422, 500

### Registration (Customer)
**POST** `/auth/register` → 202
```json
{ "email": "user@example.com" }
```
**POST** `/auth/email/verify/request` → 202
```json
{ "email": "user@example.com" }
```
**POST** `/auth/email/verify/confirm` → 200, 400, 410, 422
```json
{ "sessionId": "rs_123", "email": "user@example.com", "code": "432198" }
```
**POST** `/auth/register/complete` → 200, 400
```json
{ "sessionId": "rs_123", "fullName": "A B", "password": "N3wS3curePass!" }
```

### Registration (Partner)
**GET** `/auth/owner/registration/{{token}}` → 200, 400, 410, 409  
**POST** `/auth/owner/registration/complete` → 200, 400, 410  
**GET** `/auth/staff/registration/{{token}}` → 200, 400, 410, 409  
**POST** `/auth/staff/registration/complete` → 200, 400, 410  
**POST** `/auth/otp/request` → 202, 429  
**POST** `/auth/otp/confirm` → 200, 400, 410, 422, 429

## 7) Cookies & Headers Effects
- **Login/MFA success:** set AT/RT; issue or rotate `XSRF-TOKEN`
- **Refresh:** rotate RT; set AT; rotate `XSRF-TOKEN`
- **Logout:** clear AT/RT
- **All 429:** include `Retry-After` (seconds)

## 8) i18n Codes
Map `error.code` to keys like:  
`auth.login.invalid`, `auth.mfa.required`, `auth.mfa.totp.invalid`, `auth.passwordReset.sent`, `auth.emailChange.sent`, `auth.error.rateLimited`, `auth.error.generic`

## 9) Versioning & Compatibility
If current controllers expose slightly different paths, add **aliases** or progressive migration.  
A response‑normalizing interceptor can enforce the success/error envelope consistently.

## 10) Traceability
- **Source of truth:** `openapi.yaml` (OpenAPI 3.1)  
- **Error catalog:** `error-catalog.md` (code → HTTP → i18n → UX)  
- **FE summary:** `fe-service-contracts.md`

## 11) Implementation Notes (Aliases/Parity with Code)
These reflect current backend routes/behaviors that differ from the canonical paths above. They MUST be supported (aliases) or normalized during migration.

- Recovery Codes
  - Implemented: `POST /auth/recovery/generate` (issue), `POST /auth/recovery/verify`
  - Canonical: `POST /auth/recovery-codes/issue` (201), `POST /auth/recovery-codes/verify`

- Sessions / Devices
  - Implemented: `GET /auth/sessions`, `POST /auth/sessions/revoke`, `POST /auth/sessions/revoke/:id`
  - Canonical: `GET /auth/devices`, `POST /auth/devices/revoke`

- OAuth Unlink
  - Implemented: `POST /auth/oauth/:provider/unlink`
  - Canonical: `DELETE /auth/oauth/{provider}`

- MFA: TOTP & WebAuthn endpoints (AuthN/AuthZ)
  - Implemented:
    - `POST /auth/login/totp` (TOTP verify after password)
    - WebAuthn register: `POST /auth/webauthn/register/start`, `POST /auth/webauthn/register/finish`
    - WebAuthn login: `POST /auth/webauthn/login/start`, `POST /auth/webauthn/login/finish`
  - Canonical (LLD):
    - TOTP: `POST /auth/mfa/totp/verify`
    - WebAuthn assertion: `POST /auth/mfa/webauthn/assertion/options`, `POST /auth/mfa/webauthn/assertion/result`

- Cookies (names)
  - Implemented: `bsaas_at` (access), `bsaas_rt` (refresh), `XSRF-TOKEN` (non‑HttpOnly)
  - Canonical/OpenAPI cookieAuth currently refers to `access_token`; align during normalization.

- OAuth Callback
  - Implemented: returns 200 with cookies for login; 200 for link; guard allows both modes
  - Canonical: 302 redirect to app on success (login); 200 for link

> Migration plan: expose canonical paths as aliases, keep current paths during transition; update OpenAPI accordingly.
