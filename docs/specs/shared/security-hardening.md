# Security Hardening

**Date:** 2026-05-18
**Status:** Current cross-cutting baseline

## Purpose

Define baseline security requirements for backend APIs, frontend apps, integrations, and operations.

## Transport And Headers

- Production must use HTTPS.
- API responses should use security headers through the configured server middleware.
- CORS must be explicit, environment-driven, and must not use wildcard origins with credentials.
- `X-Correlation-Id` must be allowed and exposed when the API supports correlation IDs.

## Cookies And CSRF

- Access and refresh cookies must be `HttpOnly`, `Secure` in production, and `SameSite=Lax` unless a feature documents a stricter or provider-required policy.
- XSRF cookie may be readable by the browser when using double-submit CSRF.
- Unsafe methods must be protected by CSRF when cookie credentials are used, except routes explicitly marked safe by design.
- CSRF failures must return `403`.

## Authentication And Sessions

- Session refresh must rotate tokens according to Auth implementation rules.
- MFA, passkey, recovery code, and password reset flows must be rate limited.
- Session revocation must invalidate dependent refresh credentials.
- Account enumeration must be avoided in public and auth flows.

## Rate Limits

Rate limits are required for:

- login and credential verification;
- OTP/recovery/passkey challenge flows;
- public search if abused;
- provider callbacks when replay is possible;
- write-heavy endpoints such as booking, checkout, review submission, and notification dispatch.

## Secrets And Configuration

- Secrets must not be committed.
- Provider credentials must be environment-managed or secret-manager-managed.
- Test fallbacks must be clearly test-only.
- Logs and audit records must not include secrets.

## Dependency And Supply Chain

- Dependency upgrades must consider security advisories and framework compatibility.
- Do not add new runtime dependencies for simple utilities that can be handled by existing framework or standard APIs.
- External packages that handle auth, payments, crypto, or parsing must be reviewed before use.

## Data Protection

- PII must be scoped to the minimum necessary feature boundary.
- Private customer notes, consent states, and payment-related data must not appear in public APIs.
- Data export/delete behavior must follow [Data Privacy And Governance](../../us/data-privacy/README.md) until the production privacy spec is created.

## Security Test Requirements

Each feature must include tests for:

- unauthenticated request;
- authenticated but unauthorized request;
- cross-scope access attempt;
- CSRF failure when applicable;
- rate limit behavior when applicable;
- sensitive data exclusion from response body;
- audit/log redaction for high-risk paths.
