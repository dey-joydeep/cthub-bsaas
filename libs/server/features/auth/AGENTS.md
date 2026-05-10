# Auth Backend Guidelines

Read this file before working under `libs/server/features/auth/**`.

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

## Testing Requirements

- Auth UT must remain at 100% coverage.
- Auth IT must remain at 100% coverage.
- Edge-case specs belong under `tests/integration/edge-case/**` and must end with `.it-spec.ts`.
- Add tests for every behavior branch introduced by Auth changes.
- Run:
  - `npx nx test server-feature-auth --configuration=ut`
  - `npx nx test server-feature-auth --configuration=it`
  - `npx nx lint server-feature-auth`
  - `npx nx build server-feature-auth`
  - `node_modules/.bin/redocly.cmd lint docs/specs/auth/API/openapi.yaml --config .redocly.yaml --max-problems=0`
  - `node_modules/.bin/tsx.cmd scripts/openapi-auth-check.ts`

## Definition Of Completion

1. Production-grade implementation with no stubs or placeholder/minimal shortcuts.
2. Approved spec followed.
3. Specs updated before or with code when behavior changes.
4. UT, IT, and edge-case tests maintained as applicable.
5. 100% Auth coverage maintained without Istanbul ignore markers.
6. Lint and build pass.
7. OpenAPI route parity passes.
