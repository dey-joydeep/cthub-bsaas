# Auth Backend Foundation - Branch Scope And Status

**Branch:** `feat/auth-backend-foundation`
**Updated:** 2026-05-04
**Primary code area:** `libs/server/features/auth`
**Supporting code areas:** `libs/server/core`, `libs/server/contracts-auth`, `libs/server/infrastructure`, `apps/api`

## Purpose

This branch is the backend foundation workstream for the Auth feature. Its goal is to make the Auth backend production-grade against the current OpenAPI contract, server architecture rules, and test/coverage requirements.

The branch is not a frontend implementation branch and is not an E2E expansion branch. Web and E2E work may be referenced for alignment, but the branch scope remains backend Auth and supporting server infrastructure.

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
| CI contract gate | Pending | The parity script exists; a CI job still needs to enforce it. |
| Server-wide coverage gate | Pending | Auth has project thresholds; broader server-feature CI enforcement remains future hardening. |

## Validation Commands

Run these for this branch before merging backend Auth changes:

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

## Remaining Work For This Branch

1. Wire `scripts/openapi-auth-check.ts` into CI.
2. Add/confirm CI jobs that enforce backend feature coverage thresholds.
3. Decide whether no-restricted-import hardening for server-core deep imports should be implemented now or tracked under infra hardening.
4. Keep this document current whenever Auth route scope, validation commands, or completion status changes.

## Out Of Scope

- Adding legacy route aliases.
- Expanding web E2E coverage.
- Migrating Jest to Vitest.
- Implementing frontend Auth screens.
- Reworking unrelated backend domains.

## Historical Note

This document replaces older branch notes that mixed completed work, superseded alias plans, and stale current-status snapshots. Historical details remain available in Git history; this file should now be treated as the live branch scope/status document.
