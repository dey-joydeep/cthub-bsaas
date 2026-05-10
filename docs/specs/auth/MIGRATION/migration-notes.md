# Migration Notes

From the original single-frontend/backend specs to consolidated multi-app + single backend:

- **Unify tokens**: move from `Authorization: Bearer` headers to **HttpOnly cookies** for first-party apps.
  - Cookie names and attributes:
    - Access: `bsaas_at` — HttpOnly, Secure, SameSite=Lax, path `/`
    - Refresh: `bsaas_rt` — HttpOnly, Secure, SameSite=Lax, path `/auth`
    - CSRF: `XSRF-TOKEN` — non-HttpOnly, issued on login and rotated on refresh
  - Config keys: `AUTH_COOKIE_DOMAIN`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`
- **Remove SMS OTP** (cost): keep Email OTP + TOTP + Passkeys.
- **Remove security questions**: use recovery codes + passkeys/TOTP.
- **Add CSRF protection**: double-submit token pattern.
- **Document SSO** across subdomains with cookie domain `.cthub.in`.
- **Consolidate endpoints**: one `/auth/*` namespace with WebAuthn/TOTP endpoints.
  - Changes vs legacy:
    - Password login now `POST /auth/login` (was `/auth/sign-in`)
    - TOTP enroll alias endpoints: `POST /auth/totp/enroll/start`, `POST /auth/totp/enroll/finish`
    - Recovery codes: `POST /auth/recovery/codes` (generate) and `POST /auth/recovery/verify` (consume)
    - WebAuthn login start allows unauthenticated identity via `{ email | userId }`; finish issues cookies and returns `{}`
- **Separate logs**: access vs application; introduce structured audit log.
