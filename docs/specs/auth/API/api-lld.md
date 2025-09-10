# Auth API — Low-Level Design (LLD)
**Status:** Authoritative (merged; supersedes dated “Updates” entries)  
**Scope:** Non-registration authentication — DTOs, validation, error handling, services, ENV, data access, and tests.  
**Locales:** en/bn/hi

## 1) DTOs & Validation (Server-Side)
- **/auth/login**
```json
{
  "email": "user@example.com",
  "password": "S3curePass!",
  "rememberMe": true
}
```
  - `email`: RFC 5322, ≤254  
  - `password`: 8..128  
  - Throttle per IP & per account; lockout after `AUTH_LOGIN_MAX_ATTEMPTS` for `AUTH_LOCKOUT_MINUTES`

- **/auth/mfa/totp/verify**
```json
{
  "challengeId": "ch_abc",
  "code": "123456"
}
```
  - `code`: 6 digits; skew ±`AUTH_TOTP_SKEW_STEPS`

- **/auth/mfa/totp/enroll** → **Response**
```json
{
  "success": true,
  "data": {
    "qrCodeDataUrl": "data:image/png;base64,...",
    "issuer": "CTHub",
    "label": "user@example.com"
  }
}
```

- **/auth/mfa/totp/confirm**
```json
{
  "code": "123456"
}
```
  - Require **2 consecutive** valid codes

- **/auth/mfa/webauthn/attestation|assertion/options** → **Response**
```json
{
  "success": true,
  "data": {
    "publicKey": { "challenge": "base64url", "timeout": 60000 }
  }
}
```

- **/auth/password/reset/request**
```json
{
  "email": "user@example.com"
}
```

- **/auth/password/reset/confirm**
```json
{
  "token": "reset_abc",
  "newPassword": "N3wS3curePass!"
}
```

- **/auth/email/change/request**
```json
{
  "newEmail": "new@example.com"
}
```

- **/auth/email/change/confirm**
```json
{
  "otp": "654321"
}
```

- **/auth/devices/revoke**
```json
{
  "deviceId": "dev_1"
}
```

## 2) Error Handling (Authoritative)
Unified error filter returns:
```json
{
  "success": false,
  "code": "auth.error.generic",
  "message": "Human readable message",
  "details": [
    {
      "field": "password",
      "reason": "tooWeak"
    }
  ],
  "meta": {
    "correlationId": "c-01HZZ..."
  }
}
```
**Status→Situation**
- `200`: OK / next step provided
- `201`: resource created (recovery codes)
- `202`: accepted (email dispatched)
- `400`: malformed / missing fields
- `401`: auth failure / wrong user or session
- `403`: forbidden/CSRF (e.g., refresh misuse)
- `404`: not found (device/session)
- `410`: expired link/challenge
- `422`: validation error / invalid OTP/assertion
- `429`: rate limited / attempts exhausted / cooldown (include `Retry-After`)
- `500`: unexpected (log correlationId)

## 3) Services & Dependencies
- **AuthService** — verify credentials; emit `next` state; set cookies.  
- **MfaService** — TOTP (enroll/confirm/verify), Passkeys (attestation/assertion via `@simplewebauthn/server`).  
- **VerificationChallengeService** — email OTP issuance/confirm for password reset, email change (purpose-driven).  
- **SessionService** — AT/RT creation/rotation, device registry, logout flows.  
- **RateLimiter** — IP/account scopes with exponential backoff; stores in Redis.  
- **EmailAdapter** — transactional emails (reset sent, email change sent); i18n templates for en/bn/hi.  
- **AuditLogService** — structured events with masked identifiers and `correlationId` propagation.

## 4) ENV (Configuration)
```json
{
  "AUTH_LOGIN_MAX_ATTEMPTS": 10,
  "AUTH_LOCKOUT_MINUTES": 15,
  "AUTH_TOTP_SKEW_STEPS": 1,
  "AUTH_PASSKEY_RPID": "cthub.in",
  "AUTH_RESET_TTL_HOURS": 72,
  "AUTH_EMAIL_CHANGE_TTL_HOURS": 24
}
```

## 5) Prisma Touchpoints (Read/Write)
- **User** — read by email; update `lastLoginAt`, MFA flags; enforce uniqueness on email change.  
- **RefreshToken** — rotate (new `jti`); deny-list old on refresh.  
- **CredentialTOTP / CredentialPasskey** — CRUD for enroll/remove; verify on login.  
- **PasswordReset** — single-use token, TTL; mark used on confirm.  
- **EmailVerification** — `purpose=password_reset|email_change`; attempts counter; TTL; mark used.  
- **Session/Device** — list and revoke; ownership checks.  
- **RecoveryCode** — issue (hashed), list masked hints, verify (rotate on use).

## 6) Cookies & CSRF
- Set/clear/rotate HttpOnly AT/RT; rotate `XSRF-TOKEN` on login/refresh.  
- FE sends `X-XSRF-TOKEN` header (double-submit).

## 7) Tests
- **Unit** — DTO validators; rate limiter policies; TOTP skew; WebAuthn verification; error mapper.  
- **Integration** — login→mfa→signed in; reset confirm revokes sessions; email change uniqueness; devices revoke.  
- **E2E** — passkey assertion happy path; TOTP enroll+verify; recovery codes issue+use; refresh rotation.

## 8) Observability
- Correlation IDs on all requests; structured logs (pino).  
- Metrics: `login_failures_total`, `mfa_prompts_total`, `refresh_rotations_total`, `reset_requests_total`.

## 9) Compatibility
If existing controllers use different paths (`/auth/login/totp`, `/auth/sessions`), expose **aliases** to these canonical routes and enable a **response-normalizing interceptor** to enforce the success/error envelope without breaking current clients.
