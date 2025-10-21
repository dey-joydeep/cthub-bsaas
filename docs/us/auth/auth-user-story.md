# Authentication & Authorization — Common User Story (All Apps)

**Date:** 2025-09-01
**Status:** Draft v2 (Option **B**: In‑house auth; Flexible reset policy)

## 1) Scope & Context

Multi-tenant Beauty‑SaaS with **one NestJS 11** backend and **three Angular 20** frontends:

- **Admin** (platform control, tenant provisioning — highest risk)
- **Partner** (Salon Owner + Staff — operational)
- **Customer** (end‑users — bookings, coupons, reviews)

Design goals: **secure‑by‑default**, **SSR‑friendly**, **i18n‑ready**, **accessible**, consistent UX across apps.
Tooling: **Nx 21** monorepo, **Material v3**, **Tailwind v4**, **Jest 29** (unit/integration), **Playwright** (E2E).

## 2) Personas (shared)

| Persona        | Apps     | Risk     | Notes                                      |
| -------------- | -------- | -------- | ------------------------------------------ |
| Platform Admin | Admin    | Critical | 2FA **mandatory**; passkeys preferred      |
| Salon Owner    | Partner  | High     | 2FA **recommended**; can enforce for staff |
| Staff          | Partner  | Medium   | 2FA optional unless policy requires        |
| Customer       | Customer | Low      | Friction‑light; strong recovery path       |

## 3) Authentication Model (baseline)

- **Primary:** Cookie‑based auth using **Access Token (AT)** short‑lived and **Refresh Token (RT)** rotating; both are **HttpOnly + Secure** cookies.
- **Rotation & Revocation:** Each refresh rotates RT (new `jti`); previous RT becomes invalid. **Redis** stores RT states/deny‑list.
- **Cookie scope:** Top‑level domain (e.g., `.cthub.in`) to allow **SSO across subdomains** (`admin.`, `partner.`, `app.`). `SameSite=Lax` by default.
- **Bearer tokens:** Reserved for 3rd-party API clients only (not used by our first-party web apps).
- **CSRF:** For state-changing requests, use **double-submit** anti-CSRF token (non-HttpOnly `XSRF-TOKEN` cookie + `X-XSRF-TOKEN` header). Angular's HttpClient XSRF support is leveraged.
- **Customer Social Login:** Google and Meta via OAuth 2.0/OIDC with PKCE, `state`, and `nonce`; supports account linking/unlinking.

## 4) Password Policy (modern / NIST‑aligned)

- **Min length 8**, allow **64+** (passphrases).
- No forced composition rules; show **strength meter** and guidance.
- Allow paste & “show password” toggle.
- **No periodic expiry** unless compromise.
- **Breach check** on set/change (reject known compromised secrets).
- Store with **bcrypt/argon2**, with per‑user salt + server‑pepper; tune cost for p95 < 100ms on server.

## 5) Strong Auth (2FA) — Passkeys & TOTP

- **Passkeys (WebAuthn/platform)** — phishing-resistant; **required for Admin**, recommended for Owner.
- **TOTP (RFC 6238)** — 30s step, 1–2 step clock skew allowed; enroll via QR in any authenticator app (Google Authenticator, Aegis, etc.).
- **Email OTP (OOB)** — fallback only (short TTL, anti-replay). **No SMS OTP** (out of scope due to cost).
- **Recovery codes** — one-time use set; shown once on enrollment; rotate on use; stored hashed.

## 6) Account Recovery (Flexible policy)

- **Forgot password** flow does **not** disclose account existence.
- If account exists:
  - Send **single‑use reset link** (TTL 72h; invalidate on use).
  - If 2FA is enabled and available → require **second factor** during reset confirmation.
  - If 2FA **unavailable** → accept **recovery code** instead; if none, escalate to **manual verification** (tenant policy) with cool‑off and audit.
- On successful reset → revoke all other sessions and rotate RT.

## 7) Email Verification & OTP (no SMS)

- **Email verification OTP** (6 digits) TTL **10 minutes**; resend with exponential backoff and daily cap.
- **No SMS**: We avoid phone/SMS OTP to keep costs zero; rely on email and TOTP/passkeys.
- For development: use Mailpit/MailHog; for production: SMTP with self-hosted Postfix/OpenSMTPD or a free-tier provider (if available).

## 8) Sessions & SSO

- **AT TTL:** 10–15 minutes; **RT TTL:** policy-driven (e.g., 30–180 days), rotation enabled.
- **Stay signed in:** UX-only hint; backend applies persistent RT policy; no `rememberMe` flag in API.
- **Idle timeout:** configurable by app (shorter for Admin).
- **Active devices**: list with device/UA/IP/lastSeen; **remote logout** and **logout‑others**.
- **Absolute session age**: Admin may require re‑auth after 24h even if active.

## 9) Rate Limiting & Abuse Controls

- **Login attempts**: per‑account counters with exponential backoff; IP/device as a signal.
- **OTP/TOTP attempts**: per‑account + per‑device caps; lockout & `Retry‑After`.
- **Reset & verification links**: single‑use; issuance caps per hour/day; token binding to device fingerprint where feasible.

## 10) Audit/Security Logs

- Fields: userId/anon, tenantId, ip, ua, deviceId, action (login, logout, refresh, 2fa‑verify, passkey‑register, reset‑request, reset‑confirm…), result, reason, `correlationId`, ts.
- **No PII** in logs; mask identifiers.
- Retention: **400 days** (configurable). Export scoped by tenant. Real‑time stream to SIEM optional.

## 11) i18n & Accessibility

- Locales: **en/bn/hi**; all auth strings externalized.
- Forms: semantic labels, ARIA attributes, error summaries, focus management, visible instructions for OTP TTL/backoff.
- Timezone‑aware timestamps in messages.

## 12) Non‑Functional Requirements

- **Perf targets** (server): p95 login < **900ms** (excl. email/SMS latency), refresh < **200ms**.
- **Availability:** 99.9% monthly for `/auth/*`.
- **Security:** OWASP ASVS L2 baseline for auth; regular dependency & secret scans.

## 13) Acceptance Criteria (Common, Gherkin)

### AC‑1: Cookie flags & SSO

**Given** a successful sign‑in
**Then** AT/RT cookies are set with `HttpOnly`, `Secure`, `SameSite=Lax`, domain `.cthub.in`
**And** I can navigate between Admin/Partner/Customer subdomains without re‑login (until AT expiry).

### AC‑2: Refresh rotation

**Given** a valid RT
**When** I call `/auth/refresh`
**Then** a new AT+RT pair is issued
**And** the prior RT `jti` is invalidated and cannot be replayed.

### AC‑3: 2FA enrollment & recovery codes

**Given** a user with 2FA not enrolled (Admin must enroll)
**When** they finish enrollment (Passkey or TOTP)
**Then** they receive **one‑time recovery codes** and must acknowledge storage.

### AC‑4: Flexible reset with fallback

**Given** a user with 2FA who lost their device
**When** they use a **recovery code** during password reset confirmation
**Then** the reset succeeds and all other sessions are revoked.

### AC‑5: Anti‑enumeration

**Given** a password reset request for any email
**Then** the system responds with a **generic** message and audit logs the request without confirming existence.

### AC‑6: CSRF protection

**Given** a state‑changing request from the browser
**Then** backend validates the anti‑CSRF header against the **XSRF cookie**; requests without valid token are rejected (403).

## 14) Definition of Ready

- Cookie domain strategy decided (e.g., `*.cthub.in`), mail/SMS providers configured, Redis available, base i18n keys present.

## 15) Definition of Done

- All ACs pass on **Admin/Partner/Customer** apps.
- Unit tests (Jest) for guards/interceptors/services; **Playwright** E2E for core flows; **k6** smoke for `/auth/*`.
- Security review: secrets in env, cookie flags correct, headers (CSP, HSTS) tuned per app.

## 16) Links

- **Admin US:** [admin-auth-user-story.md](admin-auth-user-story.md)
- **Partner US:** [partner-auth-user-story.md](partner-auth-user-story.md)
- **Customer US:** [customer-auth-user-story.md](customer-auth-user-story.md)

## 17) Open Questions — Proposed Resolutions

1. **Device fingerprint strategy for token binding**
   - **Decision:** Use a lightweight, privacy-respecting fingerprint (hashed tuple of: user agent, platform hints, coarse IP /24, and a client-generated device ID cookie).
   - **Usage:** Signal-only for risk scoring and session list; **never** a hard requirement to log in.
   - **Security:** Do not block solely on fingerprint; combine with rate limits and 2FA.

2. **Tenant-level policy defaults for 2FA and session TTLs**
   - **Admin:** 2FA **required**; **AT 10–15m**, **RT 14d**, idle timeout **10–15m**, absolute age **24h**.
   - **Owner:** 2FA **recommended** (toggle to require); **AT 10–15m**, **RT 14–30d**, idle **15–20m**.
   - **Staff:** 2FA **optional** unless policy mandates; same AT/RT as Owner; idle **20–30m**.
  - **Customer:** 2FA optional; **AT 15m**, **RT 30–180d** per policy; no per-login flag.

3. **Subdomain mapping vs single-domain with prefixes**
   - **Decision:** Prefer **subdomains** — `admin.cthub.in`, `partner.cthub.in`, `app.cthub.in`.
   - **SSO:** Cookies scoped to `.cthub.in` with `SameSite=Lax`.
   - **CSP:** Per-subdomain CSP for tighter sandboxing.

## 18) OSS Building Blocks (Free)

- **WebAuthn:** `@simplewebauthn/server` + `@simplewebauthn/browser` (MIT).
- **TOTP:** `otplib` (MIT).
- **Email delivery:** `nodemailer` with self-hosted **Postfix/OpenSMTPD**; use **Mailpit/MailHog** for local test.
- **Rate limiting:** `rate-limiter-flexible` with Redis OSS.
- **Audit/Logging:** `pino` or `winston`; stream to file or OpenSearch/ELK OSS if needed.
- **Testing:** **Jest 29** (unit/integration), **Playwright** (E2E), **k6** (perf).

## 19) Updates — 2025-09-06 (Append-only)

- **Added:** [customer-auth-registration.md](./customer-auth-registration.md) — Customer self‑registration (email/password + OTP) and Social sign‑in behaviors (creation/linking, deduplication, fallback OTP).
- **Added:** [partner-auth-registration.md](./partner-auth-registration.md) — Partner Owner (sessioned link) & Staff (invite + temp password) onboarding with **mandatory MFA** and **MFA gating**.

### Clarifications (unchanged behaviors)

- **Common validation & i18n:** Reuse existing rules and localization framework; no changes needed.
- **Sessions & Cookies:** Reuse existing issuance (AT/RT) and XSRF rotation mechanics; no changes.
- **Customer social vs profile tables:** `social_account` (auth identity) remains separate from `social` (public profile links).
- **Business value of Customer linking:** Operational uplift (conversion/retention/dup‑prevention), not extra KYC; no policy relaxation.

---

### Superseded on 2025-09-07 — Reasons
- Customer flow must be **OTP-first** with Ephemeral RegSession (no DB user before OTP). 
- `fullName` rule updated to **Unicode letters + single spaces only**; server collapses double spaces; punctuation/hyphens rejected.
- Partner (Owner/Staff) access is **gated by MFA**; scheduler sends reminders **every 2 days** until enrolled.
- Endpoints now have explicit **status→situation** mapping and **unified error shape**.
- Notifications: Customer **Welcome** on completion; Partner **Setup-Next** on password set.
- Locales fixed to **en/bn/hi** across UI messages.

---

## Updated Full Spec — 2025-09-07

# Authentication & Authorization — User Stories (Aggregate)
**Date:** 2025-09-07  
**Status:** Authoritative  
**Stack:** NestJS 11 backend · Angular 20 (Material v3 + Tailwind v4) · Nx 21 · Jest 29 · Prisma (PostgreSQL) · Redis  
**Locales:** en/bn/hi

This document consolidates **Customer registration (OTP-first RegSession)**, **Partner onboarding (Owner/Staff) with MFA gating and reminders**, and shared **verification challenges**. It supersedes previous drafts.

## 1) Scope & Context
Single backend; 3 web apps: **Admin**, **Partner**, **Customer**. Cookies enable SSO across subdomains of `.cthub.in`.

## 2) Personas
| Persona | App | Risk | Notes |
|---|---|---|---|
| Platform Admin | Admin | Critical | 2FA mandatory; passkeys preferred |
| Salon Owner | Partner | High | 2FA required; reminders if unenrolled |
| Staff | Partner | Medium | 2FA required by policy; reminders if unenrolled |
| Customer | Customer | Low | Friction-light, OTP-first; strong recovery path |

## 3) Authentication Model
- **AT/RT cookies**: Short-lived Access Token + rotating Refresh Token; `HttpOnly; Secure; SameSite=Lax; Domain=.cthub.in`.
- **CSRF**: Double-submit token (Angular XSRF).
- **Sessions**: RT rotation with jti; Redis denylist; device list; remote logout.
- **Social (Customer)**: Google/Meta via OAuth2/OIDC + PKCE; supports account linking/unlinking.
- **Security headers**: CSP, HSTS; rate limits per IP/email for sensitive endpoints.

## 4) Registration & Verification (Canonical)
### 4.1 Customer (OTP-first; **Ephemeral RegSession**)
1. `POST /auth/register` → Create **RegSession** in Redis (TTL), send Email OTP; return `{ "sessionId":"...", "otp":{"ttlSec":600,"resendAfterSec":60,"maxAttempts":5}, "maskedEmail":"a***@ex.com", "next":"otp" }`. No DB `User` yet.  
2. `POST /auth/email/verify/confirm` with `{ "sessionId":"...", "email":"...", "code":"123456" }` → mark email proven, `{ "emailVerified":true, "next":"setPassword" }`.  
3. `POST /auth/register/complete` with `{ "sessionId":"...", "fullName":"...", "password":"...", "consent":true }` → Create `User`, set `isVerified=true` + `emailVerifiedAt=now()`, issue AT/RT cookies; **Welcome email**.  
- **Resend**: `POST /auth/email/verify/request` → `202` with cooldown/daily caps; new code resets attempts for that OTP.  
- **Abandon = discard**: If user leaves, RegSession expires → nothing persisted.

**Name rule**: `fullName` = Unicode **letters + single spaces only**. Two consecutive spaces are collapsed server-side; **hyphens/punctuation/digits/emoji** → validation error.

### 4.2 Partner (Owner/Staff) — **Resume enabled**
- **Owner**: 30-day sessioned link → set password → API returns `{ "isMFAEnrollRequired": true }` → must enroll Passkey/TOTP before access.  
- **Staff**: Email invite with temp password → rotate to new → `{ "isMFAEnrollRequired": true }` → enroll MFA before access.  
- If user signs out before MFA, sign-in is gated to MFA enrollment.

## 5) Password Policy
Min 8; allow 128+; paste allowed; strength meter; breach check on set/change; argon2/bcrypt.

## 6) Strong Auth
Passkeys (WebAuthn) preferred; TOTP supported; Email OTP only for verification/recovery. Recovery codes (hashed, rotate on use).

## 7) Notifications
- Customer: **Welcome** on first completion (also on first Social creation).  
- Owner/Staff: **Setup next steps** email (CTA to MFA).  
- **Partner MFA reminders**: every **2 days** while `isMFAEnrollRequired=true` (scheduler service).

## 8) Database Overview
- Keep: `User`, `EmailVerification`, `Session`, `RefreshToken`, `CredentialPasskey`, `CredentialTOTP`, `SocialAccount`, `Social`, `Salon`, `SalonTenant`, `SalonTenantStaff`.
- Add to `User`: `emailVerifiedAt`, `isMFAEnrollRequired`, `mfaReminderFirstAt`, `mfaReminderLastAt`.
- New: `RegistrationLink` (Owner), `StaffInvite` (Staff).
- Extend `EmailVerification`: `purpose`, `sessionId?`, `meta?` to unify OTP flows.

## 9) Scheduler (Separate Service)
`apps/scheduler` (NestJS 11). Cron for Partner MFA reminders; Redis **Redlock**; Prisma; EmailAdapter; health and metrics.

## 10) i18n & Accessibility
Locales en/bn/hi; all messages have keys (see web LLD); ARIA live regions; consistent focus/announcements; generic responses to avoid account enumeration.

## 11) Status & Error Shape (Normative)
- Errors: `{ "success": false, "code": "<i18nKey>", "message": "...", "details":[{"field":"...","reason":"..."}], "meta":{...} }` (global filter; `correlationId` in headers/body).  
- Typical statuses: `201` created, `202` accepted (resend), `200` ok, `409` conflict (email taken), `422` validation/invalid OTP, `410` gone (expired), `429` rate/attempts/cooldown, `401` auth failure, `500` unexpected. (_See API HLD for endpoint mapping._)

## 12) Acceptance Criteria (Selected)
- **CUST-OTP-DISCARD**: Abandoning before completion yields no DB user; restart is fresh.  
- **CUST-OTP-RESEND**: Resend blocked during cooldown, enabled when timer ends; new code resets attempts.  
- **PARTNER-MFA-GATE**: Access blocked until MFA enrolled.  
- **PARTNER-REMIND**: Reminders are sent every 2 days while required.  
- **NAME-RULE**: Invalid chars rejected with `auth.registration.fullName.invalidChars`; server collapses double spaces.  
- **STATUS-MAP**: Endpoints return statuses as defined.

## 13) DoR / DoD
- DoR: Cookie domain decided; Redis and email configured; i18n scaffolding present.  
- DoD: All ACs green in Admin/Partner/Customer; E2E; scheduler deployed; i18n for en/bn/hi complete.

## 14) Links
- Customer: `customer-auth-registration.md`  
- Partner: `partner-auth-registration.md`  
- Web HLD/LLD: `registration-web-hld.md`, `registration-web-lld.md`  
- API HLD/LLD: `registration-api-hld.md`, `registration-api-lld.md`  
- DB Alterations: `db-alterations-registration.md`  
- Scheduler: `scheduler-architecture.md`  
- Refactor: `refactor-verification-challenges.md`
