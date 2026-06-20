# Antigravity Guidelines: Auth Backend (`libs/server/features/auth`)

## Source Of Truth
- OpenAPI: `docs/specs/auth/API/openapi.yaml`
- API HLD: `docs/specs/auth/API/api-hld.md`
- API LLD: `docs/specs/auth/API/api-lld.md`
- Error catalog: `docs/specs/auth/API/error-catalog.md`
- Frontend service contract: `docs/specs/auth/API/fe-service-contracts.md`
- Server alignment: `docs/specs/auth/WEB/docs/auth/server-alignment.md`
- Branch status: `docs/status/auth/auth-backend-plan-and-progress-status.md`
- Route parity script: `scripts/openapi-auth-check.ts`

## Route Contract
- The Auth route contract is OpenAPI-defined.
- Do not add legacy route aliases.
- Routes absent from `openapi.yaml` are not part of the current Auth contract.
- If route behavior must change, update the spec first or in the same change and verify parity.

## Current Route Families
- Login, TOTP login, refresh, logout.
- Session list and revoke.
- Password forgot/reset/change.
- Email verification and email change.
- Recovery generate/verify.
- TOTP enroll start/finish.
- WebAuthn register/login start/finish.
- Passkey device list/delete.
- OAuth start/callback/unlink.
- Customer registration.
- Partner owner/staff registration validation and completion.

## Security And Cross-Cutting Requirements
- Auth uses HttpOnly access/refresh cookies and a non-HttpOnly `XSRF-TOKEN` cookie.
- Refresh reads `bsaas_rt`; a body refresh token is accepted only when the cookie is absent.
- Supplying both cookie and body refresh tokens is a `400`.
- State-changing protected routes must honor CSRF policy.
- Sensitive endpoints must return `429` with `Retry-After` when throttled.
- Success responses use the response envelope.
- Error responses use the canonical error envelope with `meta.correlationId` when available.
- `X-Correlation-Id` must be emitted and accepted/exposed through CORS.
- Audit events should include correlation context where available.

## Testing Requirements & Execution Protocol
- Auth UT and IT must remain at 100% coverage without Istanbul ignore markers.
- Add tests for every behavior branch introduced by Auth changes.
- **Antigravity Validation Workflow:** When modifying auth logic, use your `run_command` tool to execute the exact validation suite natively:
  - `npx nx test server-feature-auth --configuration=ut`
  - `npx nx test server-feature-auth --configuration=it`
  - `npx nx lint server-feature-auth`
  - `npx nx build server-feature-auth`
  - `npm run openapi:lint:auth` (or `node_modules/.bin/redocly lint docs/specs/auth/API/openapi.yaml --config .redocly.yaml --max-problems=0` on Windows)
  - `npm run openapi:check:auth` (or `node_modules/.bin/tsx scripts/openapi-auth-check.ts` on Windows)
- **Subagent Delegation:** When working on complex Auth interactions, deploy a `self` subagent to monitor the local `postgres` MCP for orphaned sessions or dangling refresh tokens during session revocation tests, ensuring FK constraints and DB cascades execute as designed.
