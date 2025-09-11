# Shared HLD Baselines
**Status:** Authoritative · **Locales:** en/bn/hi

## API Envelopes (canonical)
- **Success**
```json
{ "success": true, "data": {} }
```
- **Error**
```json
{
  "success": false,
  "code": "auth.error.generic",
  "message": "Human readable message (localized on FE)",
  "details": [ { "field": "email", "reason": "invalidFormat" } ],
  "meta": { "correlationId": "c-01HZZ..." }
}
```

## Cookies & CSRF
- Cookies: `bsaas_at` (AT), `bsaas_rt` (RT) set as **HttpOnly+Secure**; `XSRF-TOKEN` non-HttpOnly.
- Flags: `SameSite=Lax`; cookie domain configurable (e.g., `.cthub.in`).
- **Double-submit CSRF**: Angular sends `X-XSRF-TOKEN` header; backend verifies against cookie.

## HTTP Return Codes — Canonical Usage
- **200** OK (may include `next` state for MFA gates)
- **201** Created (e.g., recovery codes issued)
- **202** Accepted (email dispatched / asynchronous)
- **302** Redirect (OAuth start/callback)
- **400** Malformed payload/body
- **401** Unauthorized (wrong creds, wrong context)
- **403** Forbidden/CSRF
- **404** Not found (device/session)
- **410** Expired challenge/link
- **422** Validation error (field or semantic)
- **429** Rate limited / attempts exhausted (include `Retry-After`)
- **500** Generic server error

## Rate Limiting & Attempts
- Login, OTP issue/verify, TOTP confirm and passkey flows are rate limited.
- Show friendly i18n messages; surface server-provided `Retry-After` when present.

## Telemetry (examples)
- `auth_login_success`, `auth_login_failure`
- `auth_mfa_prompted`, `auth_mfa_success`, `auth_mfa_failure`
- `auth_reg_started`, `auth_reg_completed`
- `auth_password_reset_request`, `auth_password_reset_confirm`
- `auth_email_change_request`, `auth_email_change_confirm`
- `auth_devices_revoked`, `auth_logout_others`
