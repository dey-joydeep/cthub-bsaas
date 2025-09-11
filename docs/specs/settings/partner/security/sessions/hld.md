# Partner — Sessions — HLD
**Updated:** 2025-09-11

## Scope & Objectives
This document defines the high‑level design for the **partner sessions** screen(s), covering purpose, interaction with backend, and non‑functional needs.

## Context & Stack

- Frontend: **Angular 20**, **Angular Material v3**, **Tailwind v4**
- Monorepo: **Nx 21**
- i18n locales: **en**, **bn**, **hi**
- Backend: **NestJS 11** (single API), data-access via Prisma
- Auth storage: HttpOnly cookies (AT/RT), SameSite=Lax, `Secure`; XSRF token for double-submit


## Architecture Overview
- Client: Angular SPA routes under `/partner/auth/*`
- Major parts: Route component, UI form, AuthHttpService, TelemetryService, i18n, a11y helpers
- Backend: NestJS `/auth/*` endpoints, cookies for AT/RT, optional WebAuthn

## Module/Component Breakdown
- Route module `partner/auth/sessions` (standalone)
- Presentational form component(s) + minor UI atoms
- Services: `AuthHttpService`, `TelemetryService`, `ToastService`

## User Flows (High‑Level)
- Happy path, invalid input, rate‑limited, server error, network fail

## External Interfaces
- REST endpoints under `/auth/*`; WebAuthn where applicable
- Email/OTP providers (server‑side)

## Non‑Functional Requirements

- **Performance:** Lazy-loaded feature modules; route prefetch for auth; debounce user input; optimistic UI only where safe
- **Security:** CSRF/XSRF, anti-enumeration, rate limiting, lockouts, WebAuthn for passkeys, CSP nonces
- **Availability:** Stateless FE; graceful degradation when BE unavailable
- **Observability:** FE telemetry adapters; correlationId propagation; structured logs
- **Accessibility:** WCAG 2.1 AA targets; keyboard-first design; screen-reader support


## Security Posture
- Cookies: HttpOnly AT/RT; SameSite=Lax; Secure; XSRF double‑submit token
- Anti‑enumeration on sensitive flows; uniform success responses
- Rate‑limit sensitive endpoints (5/min IP/email); lockouts on abuse

## Internationalization
- All strings via i18n keys (en/bn/hi). Avoid hardcoded copy in templates.

## Accessibility Intent

- Inputs use `<label>` and `aria-describedby` for errors; live region `aria-live="polite"`
- Keyboard: tab order matches reading order; submit on Enter; Escape closes dialog
- Focus: first invalid control gets focus; focus trap in dialogs; visible focus rings
- Contrast AA; states not conveyed by color alone


## Performance Notes

- Show lightweight skeletons on critical forms
- Debounce validation and login attempts to avoid thrash
- Backoff on 429 with visible countdown; disable submit during cooldown
- Avoid global store for auth pages; use local signals to keep bundle small


## Analytics & Telemetry
- Provider‑agnostic FE `TelemetryService` (PostHog default; GA4/Segment adapters)
- Events:

- `auth.login_started|failed|succeeded` { method, mfa_required?, error_code? }
- `auth.mfa_prompted|completed|failed` { factor, error_code? }
- `auth.password_reset_requested|completed` { token_age_ms? }
- `auth.recovery_issued|used` { count }
- `auth.devices_revoked` { count }
- `auth.social_linked|unlinked` { provider, email_verified }
- `auth.passkey_enrolled|removed|set_default` { platform: 'platform|roaming' }
- `auth.email_change_requested|confirmed` { old_domain, new_domain }
- `auth.password_changed` { strength, had_breach_hint?: boolean }


## Password Policy

- Minimum **8** characters
- Must include **letter + number + symbol**
- **Strength meter** with hints; client shows soft warnings only
- **Server is final authority**; may apply additional checks later


## Social Sign‑in / Enterprise IdP

**Customer Social Sign‑in**: Google, Facebook, Apple.  
- Apple: first‑class on Safari/iOS/macOS; under “More options” elsewhere.  
- Instagram: profile linking only (not an auth provider).

**Admin/Partner**: Consumer OAuth disabled. Future **Enterprise IdP (OIDC/SAML)** may enable SSO at tenant level.


Tenant‑configurable **OIDC/SAML** single sign‑on (future).  
- **UX entry:** secondary action on login  
- **Config:** enable per-tenant, discovery metadata, allowed domains  
- No implementation now—this defines integration touchpoints.