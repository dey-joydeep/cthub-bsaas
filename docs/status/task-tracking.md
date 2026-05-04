# Task Tracking

**Updated:** 2026-05-04

This document tracks active local tasks at a high level. Detailed Auth backend branch status is maintained in:

- `docs/status/auth/auth-backend-plan-and-progress-status.md`

## Active Workstream

### Auth Backend Foundation

Branch:

```text
feat/auth-backend-foundation
```

Scope:

- Backend Auth feature implementation and hardening.
- Auth OpenAPI/controller parity.
- Auth UT/IT coverage enforcement.
- Auth API/server docs alignment.
- Supporting server-core pieces needed by Auth, such as envelopes, correlation ID, CSRF behavior, Retry-After behavior, and cookie handling.

Out of scope:

- Legacy route aliases.
- Frontend Auth implementation.
- Web E2E expansion.
- Jest-to-Vitest migration.
- Unrelated backend domains.

## Current Task List

| Task | Status | Notes |
| --- | --- | --- |
| Align Auth docs with current implementation | Done | OpenAPI, API HLD/LLD, and server-alignment docs are the active contract. |
| Remove stale alias references from docs | Done | Current route set is OpenAPI-defined only. |
| Auth UT coverage | Done | Must remain 100%. |
| Auth IT coverage | Done | Must remain 100%. |
| OpenAPI route parity script | Done | Script exists at `scripts/openapi-auth-check.ts`. |
| CI gate for OpenAPI route parity | Done | `.github/workflows/ci.yml` and `.github/workflows/openapi-contract.yml` run Auth OpenAPI checks. |
| CI gate for Auth backend coverage | Done | CI runs server lint/test coverage for `server-feature-auth`. |
| CI gate for all server features | Deferred | Future workflow item; other server feature work is not developed in this branch. |
| Additional server import-boundary hardening | Deferred | Tracked under infra-upgrade boundary hardening, not this Auth backend branch. |
| Final local branch validation | Done | UT, IT, lint, build, OpenAPI lint, and OpenAPI route parity passed on 2026-05-04. |

## Validation Checklist

Before considering Auth backend branch work complete:

```powershell
npx nx test server-feature-auth --configuration=ut
npx nx test server-feature-auth --configuration=it
npx nx lint server-feature-auth
npx nx build server-feature-auth
node_modules/.bin/redocly.cmd lint docs/specs/auth/API/openapi.yaml --config .redocly.yaml --max-problems=0
node_modules/.bin/tsx.cmd scripts/openapi-auth-check.ts
```

Expected result:

- Tests pass.
- Auth UT and IT coverage stay at 100%.
- Lint has zero warnings and zero errors.
- Build succeeds.
- OpenAPI route parity reports no missing routes.
