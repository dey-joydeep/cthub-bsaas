# Migration Notes

Updated: 2026-05-02

From the original single-frontend/backend specs to the consolidated multi-app + single backend:

- **Unify tokens:** first-party apps use HttpOnly cookies rather than client-managed bearer storage.
  - Access cookie: `bsaas_at`, HttpOnly, Secure in production, SameSite=Lax, path `/`.
  - Refresh cookie: `bsaas_rt`, HttpOnly, Secure in production, SameSite=Lax, path `/auth`.
  - CSRF cookie: `XSRF-TOKEN`, non-HttpOnly, issued on login and rotated on refresh.
  - Relevant config keys: `AUTH_COOKIE_DOMAIN`, access/refresh JWT expiry settings.
- **Remove SMS OTP:** keep email verification, TOTP, passkeys, and recovery codes.
- **Remove security questions:** use recovery codes plus passkeys/TOTP.
- **Add CSRF protection:** double-submit token pattern.
- **Document SSO:** support shared parent-domain cookies when `AUTH_COOKIE_DOMAIN` is configured.
- **Consolidate endpoints under `/auth/*`:**
  - Password login: `POST /auth/login`.
  - TOTP login challenge: `POST /auth/login/totp`.
  - TOTP enrollment: `POST /auth/totp/enroll/start`, `POST /auth/totp/enroll/finish`.
  - Recovery codes: `POST /auth/recovery/generate`, `POST /auth/recovery/verify`.
  - WebAuthn login: `POST /auth/webauthn/login/start`, `POST /auth/webauthn/login/finish`.
  - WebAuthn registration: `POST /auth/webauthn/register/start`, `POST /auth/webauthn/register/finish`.
- **Separate logs:** access/application logs plus structured audit events.

The current route set is the route set defined in the Auth OpenAPI contract.
