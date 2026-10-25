# Frontend Service Contracts (Auth)

Updated: 2026-05-02

`openapi.yaml` is the source of truth for request bodies, response schemas, status codes, and auth requirements. This file is only a frontend route index.

## Authentication And Sessions

- Login: `POST /auth/login`
- Complete TOTP login challenge: `POST /auth/login/totp`
- Refresh: `POST /auth/refresh`
- Logout: `POST /auth/logout`
- List sessions: `GET /auth/sessions`
- Revoke session: `POST /auth/sessions/revoke/{id}`

## Password And Email

- Forgot password: `POST /auth/password/forgot`
- Reset password: `POST /auth/password/reset`
- Change password: `POST /auth/password/change`
- Request email change: `POST /auth/email/change/request`
- Confirm email change: `POST /auth/email/change/confirm`
- Request email verification: `POST /auth/email/verify/request`
- Confirm email verification: `POST /auth/email/verify/confirm`

## Recovery, TOTP, WebAuthn, Passkeys

- Generate recovery codes: `POST /auth/recovery/generate`
- Verify recovery code: `POST /auth/recovery/verify`
- Start TOTP enrollment: `POST /auth/totp/enroll/start`
- Finish TOTP enrollment: `POST /auth/totp/enroll/finish`
- Start WebAuthn registration: `POST /auth/webauthn/register/start`
- Finish WebAuthn registration: `POST /auth/webauthn/register/finish`
- Start WebAuthn login: `POST /auth/webauthn/login/start`
- Finish WebAuthn login: `POST /auth/webauthn/login/finish`
- List passkeys: `GET /auth/webauthn/devices`
- Delete passkey: `DELETE /auth/webauthn/devices/{id}`

## OAuth

- Start OAuth: `GET /auth/oauth/{provider}/start`
- OAuth callback: `GET /auth/oauth/{provider}/callback`
- Unlink OAuth provider: `POST /auth/oauth/{provider}/unlink`

## Registration

- Customer registration: `POST /auth/register`
- Validate owner invite: `GET /auth/owner/registration/{token}`
- Complete owner registration: `POST /auth/owner/registration/complete`
- Validate staff invite: `GET /auth/staff/registration/{token}`
- Complete staff registration: `POST /auth/staff/registration/complete`

Do not introduce alternate route names in frontend services. New route names must be added to OpenAPI and implemented in controllers before use.
