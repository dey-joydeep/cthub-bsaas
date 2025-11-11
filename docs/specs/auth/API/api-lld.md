# Auth API — Low‑Level Design (LLD)
**Updated:** 2025-09-11

## 1) Module Structure
- **Controllers** per subdomain: login, mfa, password, registration, sessions, recovery, email‑change, passkeys (list/delete), social
- **Services**: credential verify, WebAuthn verify/attest, OTP dispatch/verify, invite validation, session mgmt
- **Interceptors/Filters**: error normalization → canonical error envelope; `Retry-After` on 429 (single global throttler filter); `Cache-Control: no-store`; `correlationId` (implemented: header on all responses; present in error body meta)

## 2) Business Flows / Algorithms

### A. Sign‑in with optional MFA
**Goal:** authenticate with password; branch to MFA if required.

**Algorithm (pseudo)**
1. Validate payload (email, password). If invalid → **422**.
2. Find user by email; generic failure if not found → **401**.
3. Verify password (constant‑time). If wrong → **401** and increment attempt counter.
4. Check account state: locked? → **423** (generic). disabled? → **403**.
5. If user has MFA:
   - Create `challengeId`, populate allowed methods (`totp`, `webauthn`, `recovery`), TTL (e.g., 5m).
   - Return **200** with `next="mfa"` and challenge.
6. Else:
   - Issue AT/RT cookies; rotate XSRF; return **200** with `next="signedIn"`.

**MFA TOTP verify**
1. Validate `{ challengeId, code }`. If invalid → **422**.
2. Locate challenge; if expired → **410**; if not for user → **401**.
3. Verify TOTP (RFC 6238); allow ±1 time‑step.
4. On success: clear challenge; issue AT/RT; **200**. On too many attempts: **429** with `Retry-After`.

**MFA WebAuthn assertion**
1. **options**: generate challenge with allowCredentials; return **200** with `publicKey`.
2. **result**: verify clientDataJSON, authenticatorData, signature against stored credential; on success → AT/RT; **200**; on invalid → **422**; on expired → **410**.

### B. Password Reset
**request**
1. Accept `{ email }`; always return **202** (anti‑enumeration).
2. Enforce cooldown (per email/IP); on throttle → **429** with `Retry-After`.
3. Generate reset token (TTL e.g., 15m); enqueue email.

**confirm**
1. Validate `{ token, newPassword }`. If malformed → **400**; if expired → **410**.
2. Enforce password policy on server; if weak → **400** (`WEAK_PASSWORD`).
3. In tx: set new password, rotate credentials/sessions; set cookies if auto‑login; **200**.

### C. Registration (Customer)
1. **start** `{ email }` → **202** (idempotent); ensure one active reg session per email; store `registration_sessions` with TTL.
2. **email verify request** `{ email }` → **202** (idempotent); cooldown + daily cap.
3. **email verify confirm** `{ sessionId, email, code }` → **200** or **410/400/422**.
4. **complete** `{ sessionId, fullName, password }` → **200** (tx: create user, profile, initial settings); rotate session.

### D. Registration (Partner: Owner/Staff)
1. **validate invite**: `GET /auth/(owner|staff)/registration/{token}` → **200** or **410/400/409** (expired/invalid/consumed).
2. **complete**: POST complete with profile, password/OTP; on success **200**.
3. **otp request/confirm**: **202** to send; **200/410/422/429** to confirm.

Partner registration endpoints (implemented)
- Owner validate: `GET /auth/owner/registration/:token`
- Owner complete: `POST /auth/owner/registration/complete`
- Staff validate: `GET /auth/staff/registration/:token`
- Staff complete: `POST /auth/staff/registration/complete`

### E. Sessions
- **refresh**: requires RT cookie (`bsaas_rt`) + XSRF; if both cookie and body refresh tokens are provided → **400** (validation). If no cookie present and body contains a token, body is accepted for compatibility. On success rotate RT & set AT (**200**).
- **logout**: clear AT/RT (**200**).
### F. Email Change
- **request**: `{ newEmail }` → **202**; idempotent; throttle with `Retry-After`.
- **confirm**: `{ otp }` → **200/400/410/422/401/429**; on success update email & re‑verify; rotate sessions if policy requires.

### G. Recovery Codes
- **issue**: create & persist hashed codes; return **201** with new set; revoke previous; audit.
- **verify**: constant‑time compare; successful use marks code as consumed; **200** or **422/429**.

Implementation: Recovery codes are persisted in DB (bcrypt-hashed) in all environments; no in-memory fallback.

### H. Social OAuth (Customer)
- **start**: 302 to provider with state/nonce.
- **callback**: verify state/nonce; if provider email is verified → pre‑verified; else require email verification; on link/unlink manage associations and conflicts (**409**).

## 3) Service Contracts (API)
Authoritative routes/methods → see `openapi.yaml`. LLD mirrors the same paths and methods for each domain.

Canonical routes (implemented)
- Recovery codes: `POST /auth/recovery/generate`, `POST /auth/recovery/verify`
- Sessions: `GET /auth/sessions`, `POST /auth/sessions/revoke/:id`
- Passkeys device management: `GET /auth/webauthn/devices`, `DELETE /auth/webauthn/devices/:id`
- OAuth unlink: `POST /auth/oauth/:provider/unlink`
- TOTP verify after password: `POST /auth/login/totp`
- WebAuthn register/login:
  - `POST /auth/webauthn/register/start`, `POST /auth/webauthn/register/finish`
  - `POST /auth/webauthn/login/start`, `POST /auth/webauthn/login/finish`
- TOTP enrollment: `POST /auth/totp/enroll/start`, `POST /auth/totp/enroll/finish`
- Customer registration: `POST /auth/register`

## 3.1) Adapters & Environment
- WebAuthn configuration via env:
  - `WEB_AUTHN_CHALLENGE_STORE`: `redis` (default) | `memory` (local/dev)
  - `WEB_AUTHN_CHALLENGE_TTL`: seconds (default 300)
  - Note: Tests use a stub via TestingModule provider override; production module always binds the `@simplewebauthn` adapter.
- OAuth adapter selection via env:
  - `OAUTH_ADAPTER`: `dev` (default), `google`, `meta`

## 4) Schemas / DTOs (from OpenAPI)
- **LoginDto**: `email` (email, max 254), `password` (min 8)
- **ForgotDto**: `email`
- **ResetDto**: `token`, `newPassword` (min 8)
- **TotpVerifyDto**: `challengeId`, `code` (6 digits)
- **RegisterStartDto**: `email`
- **EmailVerifyRequestDto**: `email`
- **EmailVerifyConfirmDto**: `sessionId`, `email`, `code`
- **RegisterCompleteDto**: `sessionId`, `fullName`, `password`
- **PasswordChangeDto**: `currentPassword`, `newPassword`

> For exact constraints, required flags, and enums — see `components/schemas` in `openapi.yaml`.

## 5) Response Envelope
- Non-redirect responses are wrapped by the ResponseEnvelopeInterceptor as `{ success: true, data: <payload> }`.
- Redirect responses `{ url, statusCode }` are passed through unchanged.
- Error handling returns a stable envelope via filters/guards; correlationId inclusion is implemented (error envelope includes `meta.correlationId`; success responses omit meta and rely on `X-Correlation-Id` header).

## 6) Cookies & Headers Effects
- **Login/MFA success:** set **AT/RT**; issue/rotate `XSRF-TOKEN`
- **Refresh:** rotate **RT**, set **AT**; rotate `XSRF-TOKEN`
- **Logout:** clear **AT/RT**
- **All 429:** include **`Retry-After`** (seconds)

Implementation cookie names (canonical)
- Access: `bsaas_at` (HttpOnly, SameSite=Lax, Secure: prod only, path=/)
- Refresh: `bsaas_rt` (HttpOnly, SameSite=Lax, Secure: prod only, path=/auth; Max‑Age aligns with `REFRESH_TOKEN_EXPIRES_IN_DEFAULT` or `REFRESH_TOKEN_EXPIRES_IN_CUSTOMER` based on role; default Customer: 180d). The refresh token is consumed from this cookie; body token is only read when the cookie is absent. If both are present, the request is rejected with **400**.
- CSRF: `XSRF-TOKEN` (non‑HttpOnly, SameSite=Lax, Secure: prod only, path=/)

> OpenAPI cookieAuth now uses `bsaas_at` to match implementation.

## 7) Error Handling & Mapping
- Map domain exceptions → `ApiError` (`code`, `message`, `correlationId`), never leak account existence.
- Use: **410** for expired one‑time tokens/challenges; **400** for malformed; **422** for invalid assertion/OTP; **403** for CSRF.
- i18n keys in FE derive from `error-catalog.md` (one catalog → many screens).

## 8) Rate Limits & Lockouts
- Per IP+email/user counters on login, OTP, verify, resend.  
- Cooldown returns **429** with `Retry-After`; FE must lock UI while the timer runs.

## 9) Idempotency & Replay
- Email verify request, password reset request, OTP request → **idempotent** (generic 202).  
- Confirm endpoints are **replay‑safe**: subsequent attempts return **410** (expired) or **400** (invalid) with no side effects.

## 10) Testing Strategy
- **Unit:** DTO validators, TOTP window, WebAuthn verifiers, rate‑limit gates.
- **Integration:** cookie set/clear/rotate; XSRF enforcement; registration complete transactionality.
- **Contract (CI):** controller routes validated against `openapi.yaml`.
- **E2E:** login branches (no MFA/MFA), expired tokens/challenges, rate‑limited flows, invite invalid/expired/consumed, social cancel/error.
