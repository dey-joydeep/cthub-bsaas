# Beauty‑SaaS Authentication Specs (Consolidated)
**Version:** 2025-09-01  
**Status:** Draft (aligned to User Stories v2)  
**Scope:** Single NestJS backend + 3 Angular frontends (Admin/Partner/Customer).

Key decisions:
- **Cookie-based auth** (AT short-lived, RT rotating in HttpOnly cookies).
- **Passkeys (WebAuthn)** + **TOTP** for strong auth; **Email OTP** only as fallback. **No SMS OTP**.
- **Social Login (Customer)** via OAuth 2.0/OIDC with Google and Meta; accounts may be auto-created on first login with email verification rules and merge/link flows.
- **Flexible password reset** with recovery codes.
- **Access log vs Application log** separated. Audit events structured.
- **SSO across subdomains** (e.g., `admin.cthub.in`, `partner.cthub.in`, `app.cthub.in`) via cookie domain `.cthub.in`.

See also the User Stories:
- `auth-user-story.md`
- `admin-auth-user-story.md`
- `partner-auth-user-story.md`
- `customer-auth-user-story.md`

## Folder Map (specs)
```
auth-specs-updated/
  README.md
  API/
    auth-http.md
    error-codes.md
  FLOWS/
    admin-auth-flows.md
    partner-auth-flows.md
    customer-auth-flows.md
  DATA/
    schema-auth.md
  LOGGING/
    logging-spec.md
  TESTS/
    e2e-scenarios.md
    unit-integration.md
    perf-k6.md
  MIGRATION/
    migration-notes.md
    changelog.md
```
## Zero-Cost Deployment Profile
This project is designed to run **without any paid services**:

- **Email**: self-hosted **Postfix** or **OpenSMTPD** (prod); **Mailpit/MailHog** (dev). Configure SPF/DKIM/DMARC in DNS.
- **2FA**: **Passkeys (WebAuthn)** via `@simplewebauthn` and **TOTP** via `otplib` (OSS).
- **Cache/Queues/Rate limiting**: **Redis OSS** (Docker). Use `rate-limiter-flexible` and BullMQ (optional).
- **Database**: **PostgreSQL OSS** (Docker).
- **Logging**: **pino/pino-http** to local files (no external log SaaS). Separate **access.log** and **app.log**; optional `audit_event` table.
- **Reverse proxy/TLS**: **Caddy** (automatic Let's Encrypt) or **Nginx** + certbot — both free.
- **CI**: optional **GitHub Actions** free tier (open-source repos) or local runners.
- **Captcha**: avoid paid captchas; rely on rate limits + proof-of-work (optional) + heuristic checks.
- **SMS**: **not used** (removed to avoid cost). Email OTP is fallback.
