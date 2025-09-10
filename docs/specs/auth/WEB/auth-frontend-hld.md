# Auth — WEB High-Level Design (HLD)
**Status:** Authoritative (merged; supersedes dated “Updates” entries)  
**Scope:** Non-registration authentication UX for **Sign-in**, **MFA (TOTP/Passkeys)**, **Recovery Codes**, **Sessions/Devices**, **Password Reset**, **Email Change**, **Social linking/unlink**.  
**Frontend:** Angular 20 · Material v3 · Tailwind v4 · Nx 21 · Jest 29 · Playwright  
**Locales:** en/bn/hi  
**API Envelope (canonical):**
- **Success**: `{ "success": true, "data": { ... } }`
- **Error**: `{ "success": false, "code": "<i18nKey>", "message": "...", "details":[{"field":"...","reason":"..."}], "meta": { "correlationId":"..." } }`

## 1) Routes & UX Flows
- `/login` → **LoginForm** (email, password, rememberMe) → if MFA required, open **MfaDialog** (tabs: Passkey / TOTP / Recovery). On success, route to last intent (deep-link) or default home.
- `/settings/security` → **SecuritySettings**: MFA enroll (Passkey/TOTP), Recovery Codes, Device Sessions list/revoke.
- `/password/reset` → **ResetRequest** (email) → **ResetConfirm** (new password).
- `/email/change` → **EmailChangeRequest** (new email) → **EmailChangeConfirm** (OTP).
- `/settings/accounts` → **SocialAccounts** (connect/unlink providers).

### Navigation/state rules
- Preserve intended route (“returnTo”) across auth redirects.
- Never store AT/RT in web storage; rely on cookies (`HttpOnly`).
- On successful login/MFA/refresh, re-fetch `me` and permissions before rendering protected areas.

## 2) Security (Browser)
- **Cookies:** `bsaas_at` (AT), `bsaas_rt` (RT), and `XSRF-TOKEN`. Flags: `HttpOnly` (AT/RT), `Secure`, `SameSite=Lax`, `Domain=.cthub.in` (configurable).
- **CSRF:** Angular XSRF interceptor sends `X-XSRF-TOKEN` header from `XSRF-TOKEN` cookie.
- **Anti-enumeration:** Use generic messages for login/reset requests.
- **A11y:** All dialogs trap focus; live regions for errors/success; keyboard operable.

## 3) Contracts (Frontend ↔ Backend)
> The FE must send/expect the following payloads and interpret **HTTP return codes exactly** as defined. Registration uses its own spec; below covers non-registration only.

### 3.1 Sign-in
`POST /auth/login` → **200**, **401**, **422**, **429**, **500**  
**Request**
```json
{ "email": "user@example.com", "password": "S3curePass!", "rememberMe": true }
```
**Responses**
- **200 (Password-only; signed in)**
```json
{ "success": true, "data": { "next": "signedIn", "user": { "id":"u_123", "email":"user@example.com", "fullName":"A B" } } }
```
- **200 (MFA required)**
```json
{ "success": true, "data": { "next": "mfa", "methods": ["webauthn","totp","recovery"], "mfa": { "challengeId":"ch_abc", "allowed": "totp|webauthn|recovery" } } }
```

**HTTP code usage**
- `200` valid credentials → branch by `next`
- `401` invalid credentials (generic message)
- `422` input invalid
- `429` rate-limited (per IP + per account); show retry timing
- `500` unexpected (show generic error)

### 3.2 MFA — TOTP (verify)
`POST /auth/mfa/totp/verify` → **200**, **400**, **401**, **410**, **422**, **429**, **500**  
**Request**
```json
{ "challengeId": "ch_abc", "code": "123456" }
```
**Response**
```json
{ "success": true, "data": { "next": "signedIn" } }
```
**HTTP code usage**
- `200` verified → proceed
- `400` malformed (FE bug)
- `401` wrong context/user
- `410` challenge expired → return to login; show banner
- `422` invalid code → show inline
- `429` attempts or cooldown → disable inputs; show countdown
- `500` generic

### 3.3 MFA — Passkey (WebAuthn) assertion
- `POST /auth/mfa/webauthn/assertion/options` → **200**, **401**, **429**, **500**  
- `POST /auth/mfa/webauthn/assertion/result` → **200**, **400**, **401**, **410**, **422**, **429**, **500**  
**Responses**
- **options**
```json
{ "success": true, "data": { "publicKey": { /* WebAuthn RequestOptions */ }, "challengeId": "ch_abc" } }
```
- **result**
```json
{ "success": true, "data": { "next": "signedIn" } }
```
**HTTP code usage** mirrors TOTP; show WebAuthn-native prompts and map failures to i18n keys.

### 3.4 MFA — Enrollment (Security settings / first-run gate)
**TOTP**
- `POST /auth/mfa/totp/enroll` → **200**, **401**, **429**, **500** → returns QR data + masked secret (never store in FE)
- `POST /auth/mfa/totp/confirm` → **200**, **400**, **401**, **422**, **429**, **500**
**Passkeys**
- `POST /auth/mfa/webauthn/attestation/options` → **200**, **401**, **429**, **500**
- `POST /auth/mfa/webauthn/attestation/result` → **200**, **400**, **401**, **422**, **429**, **500**
**HTTP code usage**
- `200` success; update UI (enrolled methods list)
- `400/422` show inline validation errors
- `401` require re-auth
- `429` cooldown; disable buttons

### 3.5 Recovery Codes
- `POST /auth/recovery-codes/issue` → **201**, **401**, **429**, **500** → display once; offer copy/download
- `GET /auth/recovery-codes` → **200**, **401**, **500** → masked hints only
- `POST /auth/recovery-codes/verify` → **200**, **401**, **422**, **429**, **500**
**HTTP code usage**
- `201` brand-new set issued
- `200` fetched/verified
- `422` invalid format/code
- `429` rate limit

### 3.6 Sessions / Devices
- `POST /auth/refresh` → **200**, **401**, **403**, **429**, **500** (rotates cookies)
- `POST /auth/logout` → **200**, **401**, **500**
- `POST /auth/logout-others` → **200**, **401**, **500**
- `GET /auth/devices` → **200**, **401**, **500**
- `POST /auth/devices/revoke` → **200**, **401**, **404**, **500**
**HTTP code usage**
- `200` success → reflect in device table
- `401` auth required/expired → bounce to login
- `403` CSRF/forbidden (refresh misuse) → retry after new page load
- `404` device not found (ownership)
- `429` rare; backoff

### 3.7 Password Reset
- `POST /auth/password/reset/request` → **202**, **429**, **500** (always generic UI message)
- `POST /auth/password/reset/confirm` → **200**, **400**, **410**, **422**, **429**, **500**
**HTTP code usage**
- request: `202` show “check your email” (no existence leak)
- confirm: `200` success → sign-in dialog; `410` expired; `422` invalid password; `429` cooldown

### 3.8 Email Change
- `POST /auth/email/change/request` → **202**, **401**, **429**, **500**
- `POST /auth/email/change/confirm` → **200**, **400**, **410**, **422**, **401**, **429**, **500**
**HTTP code usage**
- request: `202` show generic “sent”; `401` needs login
- confirm: `200` done; `410` expired; `422` invalid OTP/new email; `401` wrong session

### 3.9 Social (Customer)
- `GET /auth/oauth/:provider/start` → **302** redirect
- `GET /auth/oauth/:provider/callback` → **302** on success to app; **200** when link UI needed
- `POST /auth/social/unlink` → **200**, **401**, **409**, **422**, **500**

## 4) i18n (en/bn/hi)
Key families:  
- Login: `auth.login.title`, `auth.login.invalid`, `auth.mfa.required`  
- MFA/TOTP/Passkey: `auth.mfa.totp.invalid`, `auth.mfa.error`, `auth.mfa.completed`  
- Recovery: `auth.recovery.issued`, `auth.recovery.invalid`  
- Sessions: `auth.devices.revoked`, `auth.refresh.failed`  
- Reset: `auth.reset.sent`, `auth.reset.completed`, `auth.reset.linkExpired`  
- Email change: `auth.emailChange.sent`, `auth.emailChange.completed`, `auth.emailChange.invalid`  
- Rate limit/general: `auth.error.rateLimited`, `auth.error.generic`

## 5) Accessibility & Mobile
- Dialogs: focus trap, ESC to close (where safe), return focus to opener.  
- Live regions: success/error; countdowns for cooldowns.  
- Mobile: single-column forms; touch targets ≥48px; avoid horizontal scroll; sticky submit on small screens.

## 6) Telemetry
- `login.started|failed|succeeded`
- `mfa.prompted|completed`
- `recovery.issued|used`
- `refresh.rotated`
- `reset.requested|completed`
- `emailChange.requested|completed`
- `devices.revoked`
- `social.linked|unlinked`

## 7) Compatibility Note
If the backend currently exposes slightly different paths (e.g., `/auth/login/totp`, `/auth/sessions`), FE may either:
1) Call the **canonical** routes above (preferred once aliases exist), or  
2) Temporarily use existing routes behind a small API adapter service until aliases/normalizers are live.
