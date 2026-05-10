# Auth Frontend — TODO Checklist

Status: Tracking items for frontend implementation alignment with HLD/LLD.

## API Alignment (Config)
- [ ] Centralize URLs in `AuthHttpService` (finalized endpoints):
  - [ ] Login: `/auth/login`
  - [ ] Login TOTP: `/auth/login/totp`
  - [ ] Sessions revoke: `/auth/sessions/revoke` (body `{ id }`)
  - [ ] TOTP enroll: `/auth/totp/enroll/{start,finish}`
  - [ ] Recovery codes: `/auth/recovery/{codes,verify}`
- [ ] Ensure Angular HttpClient XSRF config: cookie `XSRF-TOKEN`, header `X-XSRF-TOKEN`.

## Cookie & CSRF Model
- [ ] Assume server sets cookies: `bsaas_at`, `bsaas_rt` (SameSite=Lax, Secure, HttpOnly).
- [ ] Do not store tokens client-side; rely on cookies only.
- [ ] Honor `Retry-After` for 429 cooldowns (header or payload).

## i18n Keys (en, bn, hi)
- [ ] Add keys for auth flows per LLD:
  - [ ] `auth.login.*` (title, labels, submit, errors)
  - [ ] `auth.errors.*` (invalidCredentials, invalidTotp, totpExpired, csrf, userNotFound, etc.)
  - [ ] `auth.verify.*` (requested, success, expired, invalid)
  - [ ] `auth.reset.*` (requested, success, invalid, expired)
  - [ ] `auth.recovery.*` (savePrompt, invalid)
  - [ ] `auth.passkey.*` (cancelled, unsupported)
  - [ ] `auth.oauth.*` (denied, genericError)
  - [ ] `common.errors.*` (rateLimited, validation, generic)
- [ ] Ensure Hindi (hi) assets are added alongside existing en/bn.
- [ ] Map server codes → keys as defined in HLD section 4.

## Social Login (Customer)
- [ ] Configure provider Client IDs and redirect URIs for Google and Meta.
- [ ] Implement `/auth/oauth/:provider/start` navigation with safe `redirect` allowlist.
- [ ] Add callback status page to handle `?error=...` and success redirects.
- [ ] Profile linking/unlinking UI and calls.

## SSR & Guards
- [ ] Implement `AuthGuard` and `GuestGuard` behaviors.
- [ ] Add SSR bootstrap using `TransferState` for user/session context.
- [ ] Guard WebAuthn and OAuth start behind `isPlatformBrowser`.

## Forms & Validation
- [ ] Implement form models and validators per LLD (login, TOTP, register placeholder, verify, forgot/reset, enroll TOTP, recovery).
- [ ] Add strength meter (optional) and confirm-password matching.
- [ ] Remember Me (client-only): set `remember_me=1` cookie with Max-Age=180d when checked; clear when unchecked; read on bootstrap for silent restore UX.

## Error Handling & UX
- [ ] Centralize HTTP error → i18n mapping.
- [ ] Show cooldown timers based on `Retry-After`.
- [ ] Keep generic responses for forgot/register to avoid enumeration.

## Testing
- [ ] Unit tests for services, guards, and forms validation.
- [ ] Integration tests for key flows with HTTP mocks.
