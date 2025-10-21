# Frontend Auth Integration (Angular + SSR)

Status: Authoritative for FE ↔ API integration; complements API HLD/LLD.

## Goals
- Use secure, cookie-based auth (AT short-lived, RT persistent by policy) with Angular 20 and SSR.
- Avoid client-side token storage; rely on HttpOnly cookies and CSRF protection.
- Keep FE aligned with canonical routes; avoid deprecated aliases.

## Cookies & “Stay Signed In”
- Backend issues cookies:
  - `bsaas_at` (Access Token): HttpOnly, Secure, SameSite=Lax, Path `/`.
  - `bsaas_rt` (Refresh Token): HttpOnly, Secure, SameSite=Lax, Path `/auth`, persistent Max-Age (policy-driven, e.g., 180d).
  - `XSRF-TOKEN` (CSRF): non-HttpOnly, Secure, SameSite=Lax, Path `/`.
- “Stay signed in” is a backend policy (persistent RT). Do not send a `rememberMe` flag; checkbox is UX-only.

## CSRF (XSRF) Integration
- Angular HttpClient defaults:
  - Cookie: `XSRF-TOKEN`
  - Header: `X-XSRF-TOKEN`
- Ensure HttpClient XSRF is enabled and `withCredentials: true` on API requests.
- Server enforces double-submit on state-changing requests when it has issued `XSRF-TOKEN`.
- Safe methods (GET/HEAD/OPTIONS) and explicitly annotated endpoints may skip CSRF.

## withCredentials & SSO
- Always set `withCredentials: true` on API calls so cookies flow.
- Prefer relative API URLs; SSR server (Node) can proxy origin.
- Cookies use a shared parent domain (e.g., `.cthub.in`) for SSO across `admin.`, `partner.`, `app.`.

## Canonical Endpoints (Use These)
- Auth
  - `POST /auth/login` — password login (may return MFA challenge)
  - `POST /auth/login/totp` — complete TOTP challenge
  - `POST /auth/refresh` — rotate RT; set AT
  - `POST /auth/logout`, `POST /auth/logout-others`
  - `GET /auth/sessions` — list sessions (canonical)
  - `DELETE /auth/sessions/{id}` — revoke device/session (canonical)
- Recovery Codes
  - `POST /auth/recovery-codes/issue` (201)
  - `POST /auth/recovery-codes/verify`
- Email
  - `POST /auth/email/send-verification`
  - `POST /auth/email/verify` | `POST /auth/email/verify/{request,confirm}`
- OAuth
  - `GET /auth/oauth/{provider}/start`
  - `GET /auth/oauth/{provider}/callback`
  - `DELETE /auth/oauth/{provider}` (unlink)

Deprecated aliases (avoid):
- `GET /auth/devices`, `POST /auth/devices/revoke`
- `POST /auth/oauth/{provider}/unlink`

## Error Envelope & Status Handling
- Success: `{ success: true, data: … }` (ResponseEnvelope)
- Error mapping:
  - 401: unauthenticated → redirect to login
  - 403: CSRF violation → refresh page/flow; reissue XSRF
  - 410: expired token/link → show expired UI, offer resend/refresh
  - 422: validation/assertion failed → show field or general errors
  - 429: rate limited → respect `Retry-After` and disable UI timers

## OAuth UX (Google/Meta)
- Start flow with allowlisted redirects; persist return URL via state if needed.
- On callback:
  - Login: cookies set; redirect to intended route.
  - Link (authenticated): update profile; handle conflict gracefully.
- Error query params should show actionable messages and a retry/back option.

## SSR Safety
- Guard browser-only APIs (`window`, `document`, `localStorage`, `navigator.credentials`) with `isPlatformBrowser` checks.
- Use `TransferState` to avoid duplicate fetches for initial auth/session checks.
- Never store tokens client-side; rely on cookies.

## Testing Guidance
- Unit: services/interceptors/guards; simulate HTTP with Angular testing utilities.
- Integration (web): HTTP mock tests for auth flows; ensure `withCredentials` and XSRF header are set.
- E2E: happy-path login, MFA, refresh, logout, revoke; OAuth callback success/error; cooldowns.

## References
- API HLD: `docs/specs/auth/API/api-hld.md`
- API LLD: `docs/specs/auth/API/api-lld.md`
- Frontend SSR: `docs/us/frontend/ssr-setup.md`

