# Server Endpoint Alignment

**Updated:** 2026-05-02

Status: aligned by contract check.

The backend Auth route surface is validated by `scripts/openapi-auth-check.ts`, which compares controller route-method pairs under `libs/server/features/auth/src/lib/controllers` with `/auth/*` operations in `docs/specs/auth/API/openapi.yaml`. The check also verifies that OpenAPI public/protected security expectations match controller `@Public()` metadata used by the global JWT guard.

Current OpenAPI/controller route set:

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/sessions`
- `POST /auth/sessions/revoke/{id}`
- `POST /auth/password/forgot`
- `POST /auth/password/reset`
- `POST /auth/password/change`
- `POST /auth/email/change/request`
- `POST /auth/email/change/confirm`
- `POST /auth/email/verify/request`
- `POST /auth/email/verify/confirm`
- `POST /auth/login/totp`
- `POST /auth/recovery/generate`
- `POST /auth/recovery/verify`
- `POST /auth/webauthn/register/start`
- `POST /auth/webauthn/register/finish`
- `POST /auth/webauthn/login/start`
- `POST /auth/webauthn/login/finish`
- `GET /auth/oauth/{provider}/start`
- `GET /auth/oauth/{provider}/callback`
- `POST /auth/oauth/{provider}/unlink`
- `GET /auth/webauthn/devices`
- `DELETE /auth/webauthn/devices/{id}`
- `GET /auth/owner/registration/{token}`
- `POST /auth/owner/registration/complete`
- `POST /auth/register`
- `POST /auth/totp/enroll/start`
- `POST /auth/totp/enroll/finish`
- `GET /auth/staff/registration/{token}`
- `POST /auth/staff/registration/complete`

Routes not listed above are not part of the current Auth contract.
