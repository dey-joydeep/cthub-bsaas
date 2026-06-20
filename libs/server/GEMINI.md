# Antigravity Guidelines: Server (`libs/server`)

## Architecture
- `libs/server/core`: cross-cutting concerns and shared building blocks only. Examples: guards, decorators, filters, config, encryption, validation, common services.
- `libs/server/contracts-*`: DI tokens, TypeScript ports, and boundary interfaces only. No implementations.
- `libs/server/infrastructure`: concrete adapters and implementations for ports. No domain orchestration.
- `libs/server/features/*`: domain/business use cases, controllers, services, and Nest module wiring. No low-level infrastructure implementation.

## Dependency Direction
- Features may depend on `contracts-*` and `server-core`.
- Infrastructure implements `contracts-*` ports.
- Apps wire feature modules and infrastructure.
- Do not import infrastructure from `server-core` or `contracts-*`.
- Avoid circular dependencies.
- Import from package roots such as `@cthub-bsaas/server-core`, not deep subpaths.

## Guards And Security
- Cross-cutting guards live in `server-core/src/auth/guards` and are exported from `@cthub-bsaas/server-core`.
- Feature libs must not duplicate cross-cutting guards.
- CSRF uses double-submit semantics only when the server has issued an `XSRF-TOKEN` cookie.
- Safe methods (`GET`, `HEAD`, `OPTIONS`) and `@SkipCsrf()` routes are excluded.
- Session deletion must respect FK constraints; delete dependent refresh tokens before removing sessions unless DB cascades cover it.

## External Integrations
- Feature libraries declare ports.
- Infrastructure provides concrete adapters.
- Production feature modules must not bind stub/test adapters.
- Tests may override providers with doubles in TestingModules.
- Port names use `<Domain>Port`; tokens use `UPPER_SNAKE_CASE`.
- Adapter names should identify provider or transport, for example `GoogleOAuthAdapter` or `SmtpEmailAdapter`.

## Prisma And Data Access
- Prefer Prisma MCP tools (`prisma-mcp-server`) for migration status, Studio inspection, migrate dev/reset, and local data operations.
- Fallback to Prisma CLI only when MCP is unavailable.
- Use meaningful migrations.
- Keep schema and migrations in the server data-access area.
- Do not rely on test-only encryption/JWT fallback behavior in production.
- **Antigravity Workflow:** Use `prisma-mcp-server` to inspect schemas. The schema is located at `libs/server/data-access/prisma/schema.prisma`. For schema changes, use the `prisma-mcp-server` `migrate-dev` tool (or `npx prisma migrate dev --schema=libs/server/data-access/prisma/schema.prisma` via `run_command`) to create a named migration and preserve migration history. Do NOT use `db push` as it bypasses migration files. When optimizing queries, use the `postgres` MCP server to execute `EXPLAIN ANALYZE` directly against `postgresql://postgres:root@localhost:5432/bsaas`.
- **Planning Mode:** Any change to `schema.prisma` automatically triggers Planning Mode. Submit an `implementation_plan.md` detailing the schema changes to the user before editing.

## Server Testing
- Unit tests: colocated under `src/**/*.spec.ts`.
- Integration tests: under each project `tests/integration/**/*.it-spec.ts`.
- Do not use `*.int-spec.ts` for server integration tests.
- Default `npx nx test <project>` should represent the intended project test surface.
- Split runs:
  - UT: `npx nx test <project> --configuration=ut`
  - IT: `npx nx test <project> --configuration=it`
- Backend feature libs must maintain 100% statements, lines, and functions. Branch coverage must meet project thresholds unless a documented exception is approved.
- Do not use Istanbul ignore markers to hide coverage gaps.

## Integration Test Pattern
For database-backed integration tests:
- Use `beforeAll` for static master data.
- Use `beforeEach` for unique per-test data.
- Use `afterEach` to remove per-test data and dependent rows.
- Use `afterAll` to remove master data.
- Use unique emails or IDs, for example with `randomUUID()`.
- Shared test helpers belong under `libs/server/core/src/testing/`.
- Prefer typed mocks such as `Pick<Port, 'method'>`; keep `any` local and narrow if unavoidable.
- **Antigravity Workflow:** If tests fail due to data leakage, use the `postgres` MCP server to inspect the database state and ensure your `afterEach` and `afterAll` cleanup handlers are correctly tearing down master data and dependent rows.

## Error Handling
- Controllers should return appropriate HTTP errors.
- Missing refresh token is a `400`, not a `500`.
- Error/warning code mapping shared by server and client belongs under `libs/shared`.
- Use centralized error services/filters where available.

## Completion Criteria For Server Work
1. Implementation follows the approved spec.
2. No production stubs or placeholder behavior.
3. UT and IT added or updated for changed behavior.
4. Coverage thresholds met without ignore markers.
5. Lint has zero warnings/errors.
6. Build succeeds.
7. Specs/OpenAPI updated when public behavior changes.
