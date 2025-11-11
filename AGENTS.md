# Repository Guidelines

## Agent Boot Instructions (CTHub)

### Startup Checklist (run once per session)

1. Prefer MCP tools over raw shell when they exist (less brittle, richer context).
2. Use the project root: `E:\workspace\cthub-bsaas` if windows or `~/workspace/cthub-bsaas` if linux (Nx monorepo).
3. Keep approvals “on-request” unless user changes it.

### Safe Filesystem Usage (Large Repo)

- **Never** call `filesystem.directory_tree` on the repo root.
- When exploring structure, use `list_directory_with_sizes` at depth 1 (top-level only).
- Drill down **one folder at a time** with `list_directory` (not `directory_tree`) and only when needed.
- To find files, prefer `search_files` with narrow patterns (e.g., `*.spec.ts`, `*/services/*.ts`), then open only matches you need.
- If you need a tree, limit it to a **specific subfolder** and stop after the first ~200 entries; summarize instead of pasting the full listing.
- Do **not** include raw listings > 200 lines in your messages. Summarize directory names and counts instead.

### MCP Preference & Fallbacks

- **Prisma** → use MCP tools (Studio, `migrate-status`, `migrate-dev`, `migrate-reset`) for DB schema, migrations, local data.
  Fallback: Prisma CLI only if MCP tool is unavailable.
- **Postgres** → use `postgres.query` for SQL. Fallback: `psql` only with explicit approval.
- **ESLint** → use `eslint.lint-files` for lint/fix tasks. Fallback: `npx eslint` if tool is missing.
- **Git** → prefer Git MCP tools (`git_*`) for branch, commit, diff, etc. Fallback: shell `git` if MCP tooling is unavailable.
- **Filesystem** → use FS MCP tools for reading/writing/editing/searching files inside the repo. Fallback: shell commands only for tasks MCP can’t express.

### When to Ask vs. Act

- If an MCP tool is available, use it without asking (respect approvals).
- Ask for approval before running non-trusted shell commands or anything outside the repo root.

### Common Tasks

- “Use **Prisma MCP** → `migrate-status` and summarize drift/unapplied migrations.”
- “Use **Prisma MCP → Prisma-Studio** to inspect data in `bsaas_test`.”
- “Use **ESLint MCP** to lint `libs/server/**` and apply autofixes.”
- “Use **Git MCP**: create branch `feat/{ticket}`, stage changes in `libs/server/features/...`, commit, push.”
- “Use **Postgres MCP** to run: `SELECT COUNT(*) FROM \"User\";` and report the count.”
- “Use **Filesystem MCP** to read `libs/server/features/appointment/src/lib/services/*.ts` and propose refactors.”

### Guardrails

- Stay inside `E:\workspace\cthub-bsaas` unless explicitly told otherwise.
- Surface diffs before committing large changes.
- For Nx projects, preserve workspace.json / tsconfig paths / generators.

## Environment & Shell

- Confirm runtime environment before running commands:
  - OS and shell: On Windows, prefer PowerShell Core (`pwsh`). Some POSIX tools like `sed` may be unavailable by default.
  - Node and npm: Match engines in `package.json` (Node >= 18, npm >= 9).
  - Postgres for server IT: Ensure the local test DB from `.env.test` or `libs/server/data-access/prisma/.env` is reachable.
- Shell command notes (Windows/pwsh):
  - Use `Get-Content` instead of `sed` for quick file reads.
  - Prefer `rg` (ripgrep) for searching; install it if missing.
  - Nx, npm and npx commands work the same across shells, e.g., `npx nx test <project>`.
  - Path separators: use forward slashes (`/`) in Nx targets; PowerShell accepts them.

## Tech Stack & Tools

- Backend: NestJS 11; Monorepo: Nx 21.
- Frontend: Angular 20 (Standalone + SSR), Material v3, Tailwind v4.
- Testing: Jest 29 (server and web).
- IDE: Windsurf (VSCode commands generally apply).
- Research policy: Always use official documentation for references.

## Project Structure & Modules

- Apps: separate Angular apps for Admin, Partner, Customer under `libs/web/*` (runnable wrappers under `apps/`). Single backend API under `apps/`.
- Libraries: common code and the entire backend logic live in `libs/` (e.g., `server/*`, `shared/`). Always check and reuse existing libs before adding new code.
- Output: `dist/` mirrors sources; TS path aliases resolve dist-first (see `tsconfig.base.json`). Example: `@cthub-bsaas/server-contracts-auth`.

## Docs & Specs

- User Stories (US): `docs/us/<feature>` — per-feature user stories and acceptance criteria.
- Specifications/Design: `docs/specs/<feature>` — per-feature technical specs, designs, and API contracts.
- Cross-link PRs to the relevant US and spec docs; keep them up to date with implementation.

## Build, Test, and Development

- Build: `npx nx build <project>`; multiple: `npx nx run-many -t build -p <a,b>`
- Type check: `npx nx run <project>:type-check`
- Lint: `npx nx lint <project>`
- Test: `npx nx test <project>`
- Affected: `npx nx affected -t build,test,lint`

### Testing (Server) — Unit vs Integration

- Default: `npx nx test <project>` runs both unit (UT) and integration (IT) suites.
- Split runs per project via Nx configurations:
  - UT only: `npx nx test <project> --configuration=ut`
  - IT only: `npx nx test <project> --configuration=it`
- Example (auth feature):
  - `npx nx test server-feature-auth --configuration=ut`
  - `npx nx test server-feature-auth --configuration=it`
- Optional npm scripts can be added per project for convenience (e.g., `npm run test:server-feature-auth:ut`).
- IT environment: tests use `.env.test` and shared setup/teardown in `libs/server/core/src/testing/` (excluded from builds). Ensure the test DB is up.
- Coverage: backend feature libs must maintain 100% statements/lines/functions and ≥95% branches for both UT and IT. Exceptions require explicit TODO and follow‑up task.

### Testing (Server) — Patterns and Conventions

- Shared IT helpers live in `libs/server/core/src/testing/{global-setup.ts,global-teardown.ts}` and are reused by feature libs. They handle Prisma schema sync and seed/cleanup for a deterministic test user and roles.
- Prefer typed mocks in tests (e.g., `Pick<Port, 'method'>`) over `any`. If a boundary makes typing impractical, keep the `any` usage narrowly scoped and local to tests.
- Error handling in controllers should return appropriate HTTP errors. Example: missing refresh token must return 400 (Bad Request), not 500.
- CSRF policy: the double-submit guard enforces header/cookie match only when the server has issued an `XSRF-TOKEN` cookie; safe methods (GET/HEAD/OPTIONS) and `@SkipCsrf()` are permitted.

#### Integration Test (IT) Pattern for Stateful Services

When writing integration tests for services that interact with a database, it is critical to ensure tests are isolated and can run in parallel without race conditions. The file `libs/server/features/auth/tests/integration/auth.controller.login.spec.ts` should be used as the Single Source of Truth (SSoT) for this pattern.

The established pattern involves the following hooks and strategies:

- **`beforeAll`:** Used to set up static, non-mutating master data that is required by the entire test suite.
  - **Example:** Populating the `Role` table from a shared enum using a `createRoles(prisma)` helper.

- **`beforeEach`:** Used to set up the specific, unique data required for a single test case.
  - **Example:** Creating a new `User` with a guaranteed-unique email (`test-${randomUUID()}@example.com`) using a `createTestUser(prisma, uniqueEmail)` helper.

- **`afterEach`:** Used to clean up the specific data created in the corresponding `beforeEach` hook. This ensures each test within the file is isolated from the others.
  - **Example:** Deleting the specific `User` (and their dependent records like `Session`, `UserRole`, etc.) using a `deleteTestUser(prisma, user)` helper.

- **`afterAll`:** Used to clean up the master data that was created in the `beforeAll` hook.
  - **Example:** Deleting all `Role` records using a `deleteRoles(prisma)` helper.

- **Helpers:** Common setup and teardown logic should be extracted into helper functions (e.g., `createRoles`, `createTestUser`, `deleteTestUser`) and placed in the shared `libs/server/core/src/testing/` directory. This promotes code reuse and maintainability.

This pattern ensures that tests are independent and the database does not accumulate stale data, while still allowing for parallel execution.

#### IT Spec File Pattern & File Moves

- IT spec naming: place integration tests under `tests/integration/**` and name files `*.it-spec.ts` (e.g., `auth.e2e.it-spec.ts`). Do not use `*.int-spec.ts`.
- Jest config: ensure `testMatch` includes `'<rootDir>/tests/**/*.it-spec.ts'`.
- Renaming/moving test files:
  - Tracked files: prefer `git mv old-path new-path` to preserve history.
  - Untracked files (common during local iteration): use shell moves — on Windows `Move-Item old new` (pwsh), on POSIX `mv old new`.
  - After renames, update any references (e.g., `testMatch` patterns, imports) and re-run `nx test <project> --configuration=it`.

#### Edge-Case Integration Specs

- Purpose: separate supplemental/edge-case/branch-coverage specs from primary, acceptance-style ITs.
- Location: place them under `tests/integration/edge-case/` within the project.
- Naming: keep the standard suffix so discovery still works, and add an intent hint before it. Examples:
  - `tests/integration/edge-case/auth.controller.edge.it-spec.ts`
  - `tests/integration/edge-case/totp.controller.edge.it-spec.ts`
  - Note: filenames must still end with `.it-spec.ts` to match the repo `testMatch`.
- Scope: use lightweight Nest TestingModules with mocked ports/services to hit controller/service branches without full e2e setup.
- Run only edge cases: `npx nx test <project> --configuration=it --testPathPattern edge-case`

### Security & Secrets in Tests

- Encryption: `EncryptionService` uses `ENCRYPTION_KEY` by default. In tests, it will fall back to `ENCRYPTION_TEST_KEY` or a deterministic test key when `NODE_ENV=test` to keep ITs hermetic. Do not rely on this fallback in production; provide real keys.
- JWT: access/refresh/reset/verify tokens accept env-based secrets. Tests may use fallbacks (e.g., `JWT_SECRET`) for repeatability; production should configure explicit secrets.

### Data Access Notes (Server)

- Session deletion must respect FK constraints. If refresh tokens reference sessions, delete dependent refresh tokens before removing the session (or configure proper DB cascades).

## Coding Style & Naming

- TypeScript strict; ES modules.
- ESLint + Prettier; 2‑space indent; single quotes.
- Names: files `kebab-case.ts`; types/classes `PascalCase`; values `camelCase`.

## Server-Side Function Signatures

- Parameter objects ≥3 properties: extract to a named `interface`/`type` or DTO `class` (prefer `class` for NestJS DTOs with validation/serialization).
- Return objects ≥3 properties: define a named `interface`/`type` and use it as the function return type.
- ≥3 primitive params (e.g., `string`, `number`, `boolean`): refactor into a single parameter object typed via `interface`/`type`.
- Place shared types in the relevant `libs/server/*` package near usage (or `libs/shared/*` if cross-cutting). Keep names descriptive and domain-oriented.
- Avoid anonymous object shapes in public APIs; keep function signatures self-documenting and reusable.

## Client-Side Function Signatures

- Any object parameter or object return: use a named `interface`/`type` or model/DTO `class` (do not inline anonymous object types), regardless of property count.
- ≥3 primitive params (e.g., `string`, `number`, `boolean`): consolidate into a single parameter object with a named `interface`/`type`.
- Place UI-facing models in `libs/web/*` near the feature, or in `libs/shared/*` when reused across apps.
- Prefer domain-oriented names; keep signatures stable and self-documenting for services, signals/stores, and component inputs/outputs.

## Frontend (Angular) & SSR

- Use Angular 20 standalone components for new code; avoid new NgModules.
- All web apps are SSR-enabled; code must be SSR-safe.
- SSR safety: guard browser-only APIs (`window`, `document`, `localStorage`, `ResizeObserver`, etc.) using `inject(PLATFORM_ID)` + `isPlatformBrowser()`; avoid top-level access to globals.
- Defer DOM access to lifecycle hooks that run in the browser (`ngAfterViewInit`) and wrap with browser checks when needed.
- Prefer Angular abstractions that work on server and browser (`HttpClient` with relative URLs, `TransferState` for hydration, Angular CDK utilities).
- Use SSR-compatible libraries; if not, lazy-load or guard initialization behind browser checks.

## Web Architecture Rules

- Layering (web):
  - `libs/web/config`: environment/config tokens and helpers for web only.
  - `libs/web/core/*`: core web capabilities (auth, http, testing) shared across web apps.
  - `libs/web/*/auth`: app-specific auth UX and models (Admin/Partner/Customer).
  - `libs/web/ui`: design system components (Material v3 + Tailwind v4) as standalone components.
- Standalone + packaging:
  - Use standalone components/directives/pipes; prefer functional providers (`provideHttpClient`, etc.).
  - Keep Angular libs in partial compilation mode; tsconfig: `moduleResolution: bundler`, `module: preserve`.
  - Avoid NgModules for new code; if bridging legacy, keep wrapper modules thin and temporary.
- SSR & hydration:
  - Avoid accessing browser APIs outside guarded code paths; prefer DI of `DOCUMENT`, `PLATFORM_ID`.
  - Use `TransferState` for caching API responses during SSR to reduce duplicate fetches.
  - Use relative URLs with `HttpClient`; let the server proxy origin.
- Testing (web):
  - Unit tests under `src/**/*.spec.ts` with `jest-preset-angular`; keep tests shallow and deterministic.
  - Integration tests for web libs may live under `tests/integration/**/*.int-spec.ts` when meaningful (e.g., services with HTTP mocks); include in the lib’s Jest config if used.
  - E2E remains at app level only.
- Import hygiene (web):
  - Web libs must not import from server libs. Allowed: `libs/web/*`, `libs/shared/*`.
  - Import from library package roots (path aliases), not deep relative paths across packages.
  - Keep UI in `web/ui`; do not duplicate UI in app-specific libs.

## Shared Library Rules (`libs/shared`)

- Purpose: pure, framework-agnostic TypeScript used by both server and client (e.g., types, validators, pure utils, feature-agnostic models).
- Restrictions:
  - No Angular or NestJS imports; avoid Node-only APIs (fs, path, crypto) unless browser-safe fallbacks exist and are guarded.
  - Keep code JSON-serializable where practical for SSR/TransferState.
  - Avoid runtime side effects; design for tree-shaking and bundler friendliness.
- Types & models:
  - Place cross-cutting types/enums/constants here (e.g., shared error codes, DTO contracts that are truly isomorphic).
  - Do not place persistence entities or server-only DTOs in shared; keep server-specific models in server libs.
- Testing:
  - Unit tests colocated under `src/**/*.spec.ts`; keep fast and framework-free.

## JSDoc & API Documentation

- DTOs/Models (`class`/`interface`/`type`): include a top-level JSDoc (`/** ... */`) describing purpose and usage; each property must also have a JSDoc describing semantics, units, and constraints.
- Classes (all): include a top-level JSDoc describing responsibility, invariants, and examples when helpful.
- Functions (all server and client): include JSDoc with description, `@param {Type} name` — concise description per parameter, `@returns {Type}` — what is returned, and visibility tag (`@public`, `@protected`, `@private`) as appropriate. Add `@throws` for error cases and `@deprecated` when relevant. Use `@typeParam` for generics.
- Style: prefer TSDoc/JSDoc standard tags; always use block comments (`/** ... */`), not line comments, for API docs.
- NestJS DTOs: document class and each decorated property; Angular models/services: document public API, component Inputs/Outputs, and any browser-only behavior or SSR caveats.

## Model/DTO Standards

- Separate concerns: do not expose persistence entities as API; map Entity ↔ DTO ↔ UI Model explicitly.
- One type per file; organize under `models/` and `dtos/` folders per module; re-export via a local `index.ts` barrel.
- Naming: suffix `Dto` (transport), `Entity` (DB/persistence), `Model` (UI/state), `Response` (API output); all in PascalCase.
- Immutability: prefer `readonly` properties for UI models; keep DTOs as plain data (no methods) for serialization.
- Absence vs null: use optional (`?`) for missing fields; use `null` only when semantically meaningful; document both in JSDoc.
- No anonymous shapes in public APIs; prefer `Pick`/`Omit`/composed named types for projections.

## Data Types & Serialization

- Dates: use UTC ISO-8601 strings (`toISOString()`) at API boundaries; convert to `Date` within services as needed; on Angular, parse on demand.
- Numbers with precision (money/decimal): use strings in DTOs; map to Decimal/Prisma types server-side; document currency/scale.
- IDs: prefer UUIDv4 strings; define aliases (e.g., `type UserId = string`) for clarity and future branding.
- Enums: prefer string literal unions; for Nest validation use `@IsEnum(...)`; keep server/client enums aligned in `libs/shared/*`.
- Payload limits: avoid binary/large blobs in DTOs; use dedicated upload endpoints with references.
- TransferState/SSR: ensure models/DTOs are JSON-serializable; avoid class instances/methods crossing the wire.

## Mapping & Versioning

- Centralize mappers in `*-mappers.ts` (e.g., `toDto`, `fromDto`, `toEntity`, `toModel`); keep normalization in one place.
- Output normalization: standardize list responses and metadata; prefer generic wrappers like `Paginated<T>` and `WithMeta<T, M>`.
- Versioning: favor additive changes; for breaking changes create versioned DTOs (e.g., `UserDtoV2`); mark legacy fields `@deprecated` with migration notes.
- Security: mappers must omit internal-only fields (secrets, internal IDs, audit flags) by default.

## Client Models

- State models should be `DeepReadonly<T>` where feasible; avoid accidental mutation; consider `Object.freeze` in dev.
- Component APIs: strongly type `@Input`/`@Output` with named models; avoid `any` and inline shapes.
- Serialization: prefer plain objects in stores/state; avoid persisting `Date`/`Map`/class instances through hydration; store ISO strings or POJOs.
- Unions: represent variants as discriminated unions with a stable `kind`/`type` field for easy narrowing.

## Testing Guidelines

- Unit tests: Jest `*.spec.ts` colocated next to source under `src/`.
- Integration tests: place under each project `tests/integration/**/*.it-spec.ts` (not inside `src/`). These are end-to-end tests that use a real database. They should use `beforeAll`/`beforeEach` to seed the database and `afterAll`/`afterEach` to clean up. Integration tests must run via `nx test <lib>`.
- E2E tests: live under `apps/e2e/**` as dedicated Nx projects.
  - API E2E: Jest specs in `apps/e2e/api/src/*.e2e-spec.ts`; run with `npx nx run api-e2e:e2e`.
  - Web E2E: per app under `apps/e2e/web/<app>`.
    - Admin: `npx nx run web-admin-e2e:e2e`
    - Customer: `npx nx run web-customer-e2e:e2e`
    - Partner: `npx nx run web-partner-e2e:e2e`

### E2E Projects (Detected)

- api-e2e: apps/e2e/api (Jest)
- web-admin-e2e: apps/e2e/web/admin
- web-customer-e2e: apps/e2e/web/customer
- web-partner-e2e: apps/e2e/web/partner
- Keep tests fast and isolated; mock IO/DB where sensible. Avoid flakiness and global state.
- Coverage: backend feature libs must maintain 100% coverage (statements, branches, functions, lines). Any temporary exception must include a TODO with justification and a follow-up task.

## Server Architecture Rules

- Layering:
  - `libs/server/core`: cross-cutting concerns and shared building blocks (guards, decorators, filters, config, encryption, common services, validation). No app/feature-specific logic here.
  - `libs/server/contracts-*`: DI tokens and TypeScript ports/interfaces that define boundaries (e.g., repositories, adapters). No implementations.
  - `libs/server/infrastructure`: concrete adapters/implementations for ports (e.g., Prisma repositories, external integrations). No domain/business orchestration.
  - `libs/server/features/*`: domain/business use-cases, controllers, Nest modules wiring ports to use-cases. No low-level infra.
- Guards & security:
  - Place all cross-cutting guards (e.g., `JwtAuthGuard`, `RolesGuard`, `CsrfGuard`) in `server-core/src/auth/guards` and export them from `@cthub-bsaas/server-core`.
  - Features must import guards/decorators from core; do not duplicate guards inside feature libs.
  - CSRF semantics: enforce double-submit only when `XSRF-TOKEN` cookie is present; safe methods and `@SkipCsrf()` are excluded.
- DI & boundaries:
  - Features depend on `contracts-*` ports and core, not directly on infrastructure implementations.
  - Infrastructure implements `contracts-*` ports and is wired in feature modules via DI tokens.
  - Never import from `infrastructure` inside `core` or `contracts-*`; avoid circular deps.

### External Integrations (General)

- Ports/Adapters: Feature libraries declare ports; infrastructure provides concrete adapters; apps wire adapters via DI.
- No stubs in production: Feature modules must not bind stub/test adapters. Tests may override providers with doubles in TestingModules.
- Naming: Ports use `<Domain>Port` (e.g., `EmailPort`) with UPPER_SNAKE tokens (e.g., `EMAIL_PORT`). Adapters use provider/service‑specific names (e.g., `GoogleOAuthAdapter`, `SmtpEmailAdapter`).
- E2E vs IT: Real happy‑path validations live under `apps/e2e/**`; keep library ITs hermetic and deterministic.
- Import hygiene:
  - Always import from library package roots (e.g., `@cthub-bsaas/server-core`), never deep subpaths like `../../core/...` or `@cthub-bsaas/server-core/auth/...`.
  - Prefer path aliases defined in `tsconfig.base.json` over relative paths across packages.
- Testing placement:
  - Unit tests colocated under `src/**/*.spec.ts`.
  - Integration tests under `tests/integration/**/*.int-spec.ts` and executed via `nx test <lib>`.
- Coverage enforcement:
  - Backend feature libs must maintain 100% coverage (statements, branches, functions, lines). Add Jest `coverageThreshold` per project to enforce.
  - Exceptions require TODO with justification and a follow-up task.

## Commits & Pull Requests

- Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`.
- PRs include description, linked issues, screenshots/logs when relevant, and call out breaking changes.
- Agent policy: Do not commit any changes unless the user explicitly instructs you to commit. Prefer to stage and show diffs first; commit only on request. Commit authorization is scoped to the immediately preceding task/change only and must not be inferred for subsequent or follow‑up changes; request fresh approval before any new commit.

### Branching

- Branch naming: `<type>/<short-description>`
  - `type`: one of `feature|fix|chore|docs|test|refactor|style`
  - `short-description`: kebab-case, <= 50 chars, lowercase letters/numbers/hyphens
- Example: `feature/add-user-profile`
- Workflow (confirmation required):
  1. `git fetch origin` → `git checkout <base>` → `git pull --ff-only`
  2. If working tree not clean, optionally `git stash push -u -m "pre-branch: <branch>"`
  3. `git checkout -b <branch> <base>`
  4. Optionally `git push -u origin <branch>`
- Never create or switch branches without explicit user confirmation.

## Definition of Completion (Auth & Similar Tasks)

1. Coding is production‑grade with no stubs or placeholder/minimal implementations, and follows the approved spec.
2. When the model suggests improvements, obtain approval and update the relevant spec(s) first (API/WEB/etc.) before updating code.
3. Tests: add/maintain UT, IT, and Edge‑case tests (when applicable); all must pass with 100% coverage for each category and for the overall feature.
4. Lint: zero warnings and zero errors; do not use eslint‑disable.
5. Build: must succeed.
6. If code changes are required to fix errors/warnings, repeat steps 3–5 until green.
7. Error/warning code mapping for both server and client is centralized under `libs/shared`, e.g., `libs/shared/src/lib/i18n-message-keys/auth-message-keys.ts` and `libs/shared/src/lib/i18n-message-keys/common-message-keys.ts` (grouped under INFO/WARN/ERROR).

## Roles & Workflow

- Agent responsibilities: Product Owner, Business Analyst, System Architect, Code Reviewer, Technical Guide-clarify requirements, propose architecture, enforce quality, and guide implementation.

## Security, Cost & Config

- Do not commit secrets; use env files or secret managers.
- Prefer free‑tier services and OSS tooling when integrating dependencies.
- Prisma schema/migrations: `libs/server/data-access/src/`; commit meaningful migrations.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors

<!-- nx configuration end-->
