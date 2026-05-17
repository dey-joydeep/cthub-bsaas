# Auth Backend Foundation - Completion Status

**Original branch:** `feat/auth-backend-foundation`
**Updated:** 2026-05-04
**Primary code area:** `libs/server/features/auth`
**Supporting code areas:** `libs/server/core`, `libs/server/contracts-auth`, `libs/server/infrastructure`, `apps/api`

## Purpose

This document records the completed backend foundation workstream for the Auth feature. Its goal was to make the Auth backend production-grade against the current OpenAPI contract, server architecture rules, and test/coverage requirements.

This is not a frontend implementation status and not an E2E expansion status. Web and E2E work may be referenced for alignment, but this document covers backend Auth and supporting server infrastructure only.

## Current Source Of Truth

Use these documents and files as the active contract:

1. `docs/specs/auth/API/openapi.yaml`
2. `docs/specs/auth/API/api-hld.md`
3. `docs/specs/auth/API/api-lld.md`
4. `docs/specs/auth/API/fe-service-contracts.md`
5. `docs/specs/auth/API/error-catalog.md`
6. `docs/specs/auth/WEB/docs/auth/server-alignment.md`
7. `scripts/openapi-auth-check.ts`
8. Controllers under `libs/server/features/auth/src/lib/controllers`

The route contract is OpenAPI-defined. Routes absent from `openapi.yaml` are not part of the Auth contract.

## Explicit Route Decision

Legacy route aliases are not in scope.

Earlier planning notes mentioned temporary aliases for recovery codes, devices, OAuth unlink, and session deletion. That direction was superseded. The current implementation and current specs use only the OpenAPI-defined route set.

Examples of routes that are intentionally not part of the contract:

- `POST /auth/recovery-codes/issue`
- `POST /auth/recovery-codes/verify`
- `GET /auth/devices`
- `POST /auth/devices/revoke`
- `DELETE /auth/oauth/{provider}`
- `DELETE /auth/sessions/{id}`
- `GET /auth/webauthn/assertion/options`
- `POST /auth/webauthn/assertion/verify`

## Implemented Backend Scope

### Auth And Sessions

- `POST /auth/login`
- `POST /auth/login/totp`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/sessions`
- `POST /auth/sessions/revoke/{id}`

### Password, Email, And Recovery

- `POST /auth/password/forgot`
- `POST /auth/password/reset`
- `POST /auth/password/change`
- `POST /auth/email/change/request`
- `POST /auth/email/change/confirm`
- `POST /auth/email/verify/request`
- `POST /auth/email/verify/confirm`
- `POST /auth/recovery/generate`
- `POST /auth/recovery/verify`

### MFA, WebAuthn, And Passkeys

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

## Cross-Cutting Status

| Area | Status | Notes |
| --- | --- | --- |
| Success envelope | Implemented | Auth controllers use response envelope handling for non-redirect success responses. |
| Error envelope | Implemented | `GlobalExceptionFilter` returns `{ success: false, code, message, details?, meta?: { correlationId } }`. |
| Correlation ID | Implemented | `CorrelationIdMiddleware` is registered in `apps/api/src/main.ts`; CORS allows and exposes `X-Correlation-Id`. |
| Audit correlation | Implemented | Auth audit service uses the correlation context where available. |
| CSRF refresh policy | Implemented | Refresh uses the CSRF policy when the server has issued an XSRF cookie. |
| Retry-After | Implemented | API throttler guard/filter wiring sets `Retry-After` for throttled responses. |
| Cookie handling | Implemented | Auth cookies are centralized through Auth cookie services/interceptors. |
| Controller route parity | Implemented | `scripts/openapi-auth-check.ts` compares controller routes to OpenAPI. |
| CI contract gate | Implemented | `.github/workflows/ci.yml` and `.github/workflows/openapi-contract.yml` run Auth OpenAPI lint/parity checks. |
| Auth coverage gate | Implemented | `server-feature-auth` has project coverage thresholds and CI runs server lint/test coverage for Auth. |
| Server-wide coverage gate | Deferred | Broader `server-feature-*` coverage gates belong to the upcoming workflow after those features are developed. |
| Import-boundary hardening | Deferred | Additional no-restricted-import hardening is tracked under infra-upgrade/boundary work, not this Auth backend branch. |

## Validation Commands

Run these before merging backend Auth changes:

```powershell
npx nx test server-feature-auth --configuration=ut
npx nx test server-feature-auth --configuration=it
npx nx lint server-feature-auth
npx nx build server-feature-auth
node_modules/.bin/redocly.cmd lint docs/specs/auth/API/openapi.yaml --config .redocly.yaml --max-problems=0
node_modules/.bin/tsx.cmd scripts/openapi-auth-check.ts
```

Expected Auth requirements:

- UT coverage: 100%.
- IT coverage: 100%.
- Lint: zero warnings and zero errors.
- OpenAPI route parity: no missing routes in implementation or spec.

## Branch Completion Status

Auth backend implementation tasks are complete for the recorded backend scope.

Latest local validation on 2026-05-04:

- `npx nx test server-feature-auth --configuration=ut`: passed, 100% statements/branches/functions/lines.
- `npx nx test server-feature-auth --configuration=it`: passed, 100% statements/branches/functions/lines.
- `npx nx lint server-feature-auth`: passed, zero warnings/errors.
- `npx nx build server-feature-auth`: passed.
- `node_modules/.bin/redocly.cmd lint docs/specs/auth/API/openapi.yaml --config .redocly.yaml --max-problems=0`: passed.
- `node_modules/.bin/tsx.cmd scripts/openapi-auth-check.ts`: passed, 31 implemented routes and 31 spec routes.

Future work that is intentionally outside this completed scope:

1. Broader `server-feature-*` coverage gates for undeveloped/upcoming server features.
2. Additional import-boundary hardening under the infrastructure upgrade workstream.
3. Keeping this document current whenever Auth route scope, validation commands, or completion status changes.

## Out Of Scope

- Adding legacy route aliases.
- Expanding web E2E coverage.
- Migrating Jest to Vitest.
- Implementing frontend Auth screens.
- Reworking unrelated backend domains.

## Historical Note

This document replaces older branch notes that mixed completed work, superseded alias plans, and stale current-status snapshots. Historical details remain available in Git history; this file should now be treated as the live branch scope/status document.
