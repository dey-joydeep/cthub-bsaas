# Frontend Auth Integration (Angular + SSR)

Status: aligned to `docs/specs/auth/API/openapi.yaml`.

## Goals

- Use secure cookie-based auth with Angular SSR.
- Avoid client-side token storage; rely on HttpOnly cookies and CSRF protection.
- Keep frontend service calls aligned with OpenAPI. Do not call routes that are absent from the contract.

## Cookies And Stay Signed In

Backend issues:

- `bsaas_at`: access token, HttpOnly, `Secure` in production, `SameSite=Lax`, path `/`.
- `bsaas_rt`: refresh token, HttpOnly, `Secure` in production, `SameSite=Lax`, path `/auth`, persistent Max-Age by backend policy.
- `XSRF-TOKEN`: CSRF token, non-HttpOnly, `Secure` in production, `SameSite=Lax`, path `/`.

"Stay signed in" is backend policy expressed through refresh-token lifetime. Do not send a frontend-only `rememberMe` flag unless OpenAPI later defines one.

## Authorization And Capability Hydration

- In addition to user identity and tenant scoping, access tokens signed for staff with active manager positions include `managedBranchIds: string[]` and `canManageBranches: boolean`.
- For browser clients relying on HttpOnly cookies (`bsaas_at`), `POST /auth/login` and `POST /auth/login/totp` deliver an authenticated `user` payload summary with `canManageBranches` and `managedBranchIds` directly in the response body.
- A dedicated `GET /auth/me` endpoint allows the frontend auth state (`AuthService`) to hydrate or refresh user capabilities from the active HttpOnly cookie session upon application bootstrap, tab reloads, or storage clearance.
- Route guards (`roleGuard`) and navigation components use these hydrated capabilities to gate access to branch management features (such as `/business/branches`) and redirect unauthorized users to `/unauthorized`.

## CSRF/XSRF

- Angular sends `X-XSRF-TOKEN` from the `XSRF-TOKEN` cookie.
- Auth requests must use credentials so cookies flow.
- Server enforces double-submit on protected state-changing requests when it has issued an XSRF cookie.

## Current Endpoints

### Auth And Sessions

- `POST /auth/login`
- `POST /auth/login/totp`
- `GET /auth/me`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/sessions`
- `POST /auth/sessions/revoke/{id}`

### Password, Email, Recovery

- `POST /auth/password/forgot`
- `POST /auth/password/reset`
- `POST /auth/password/change`
- `POST /auth/email/change/request`
- `POST /auth/email/change/confirm`
- `POST /auth/email/verify/request`
- `POST /auth/email/verify/confirm`
- `POST /auth/recovery/generate`
- `POST /auth/recovery/verify`

### TOTP, WebAuthn, Passkeys

- `POST /auth/totp/enroll/start`
- `POST /auth/totp/enroll/finish`
- `POST /auth/webauthn/register/start`
- `POST /auth/webauthn/register/finish`
- `POST /auth/webauthn/login/start`
- `POST /auth/webauthn/login/finish`
- `GET /auth/webauthn/devices`
- `DELETE /auth/webauthn/devices/{id}`

### OAuth And Registration

- `GET /auth/oauth/{provider}/start`
- `GET /auth/oauth/{provider}/callback`
- `POST /auth/oauth/{provider}/unlink`
- `POST /auth/register`
- `GET /auth/owner/registration/{token}`
- `POST /auth/owner/registration/complete`
- `GET /auth/staff/registration/{token}`
- `POST /auth/staff/registration/complete`

## Error Handling

- Success: `{ success: true, data, meta?: { correlationId } }`.
- Error: `{ success: false, code, message, details?, meta?: { correlationId } }`.
- `401`: unauthenticated or invalid session.
- `403`: forbidden or CSRF violation.
- `410`: expired token/challenge.
- `422`: validation/assertion failure.
- `429`: rate limited; use `Retry-After` for countdown.

## SSR Safety

- Guard browser APIs such as `window`, `document`, `localStorage`, and `navigator.credentials`.
- Prefer relative API URLs or an SSR proxy.
- Never store tokens in browser storage.

## Testing Guidance

- Unit-test services/interceptors/guards with mocked HTTP.
- Verify credentials and XSRF behavior in web integration tests.
- Keep API route names sourced from OpenAPI or `fe-service-contracts.md`.
