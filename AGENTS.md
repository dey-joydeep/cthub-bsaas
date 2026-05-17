# Repository Guidelines

## Agent Boot Instructions (CTHub Codex)

These instructions are for OpenAI Codex working in this repository.

### Startup Checklist

1. Work from the repository root: `E:\workspace\cthub-bsaas` on Windows or the checked-out repository root on another OS.
2. Read this file first, then any nested `AGENTS.md` closer to the files being changed.
3. Inspect the relevant `project.json`, `package.json`, `nx.json`, `tsconfig*`, Jest, ESLint, and docs before changing code.
4. Prefer a short plan before non-trivial edits.
5. Use the narrowest meaningful validation command before claiming completion.

### Repository Scope

- Product: CTHub Beauty-SaaS, a beauty-salon SaaS platform.
- Monorepo: Nx 21.
- Backend: single NestJS 11 API under `apps/api`, with common and feature logic under `libs/server`.
- Frontend: separate Angular 20 applications for Admin, Partner, and Customer under `apps/web/*`.
- UI: Angular Material v3 plus Tailwind v4.
- Tailwind utility classes use the `twc-` prefix; do not introduce unprefixed utility classes.
- Testing: Jest through Nx targets.
- IDE preference may vary, but this AIDD baseline is Codex-first.
- Supported i18n locales are `en`, `bn`, and `hi`.

## Source-of-Truth Order

When instructions appear to conflict, use this priority order:

1. Current user request.
2. Closest applicable `AGENTS.md` file.
3. Root `AGENTS.md`.
4. Repository docs under `docs`.
5. Existing implementation patterns.
6. Official framework/tool documentation.

Do not rely on memory when repository files or official docs can answer the question.

## Safe Repository Exploration

- Do not paste huge directory listings into responses.
- Prefer targeted file reads and searches.
- Avoid scanning generated output, cache folders, `node_modules`, and `dist` unless the task explicitly requires it.
- On Windows, prefer PowerShell-compatible commands.
- Use forward slashes in Nx project paths and imports where the repository already does so.

## Non-Negotiable Engineering Rules

- Prefer surgical changes with the smallest safe diff.
- Do not move, rename, or reformat unrelated files.
- Do not introduce a new architectural pattern when an existing project pattern already solves the problem.
- Do not invent routes, DTOs, database fields, i18n keys, or public APIs silently.
- Do not commit secrets, tokens, local environment values, private URLs, or machine-specific credentials.
- Do not directly modify generated output, build artifacts, cache folders, or `node_modules`.
- Do not use broad refactors to solve local problems.
- Use official documentation when verifying framework behavior.
- Do not add provider-specific AIDD files for Copilot, Windsurf, Cursor, Claude, Gemini, or other tools unless explicitly requested.

## Architecture Rules

### Backend

- `apps/api`: API composition/bootstrap only.
- `libs/server/core`: cross-cutting concerns such as guards, decorators, filters, config, i18n, validation, common services, and error handling.
- `libs/server/data-access`: Prisma and database access concerns.
- `libs/server/contracts-*`: ports, tokens, and contracts where used.
- `libs/server/features/*`: business features, controllers, DTOs, services, repositories, models, and validators.
- Controllers stay thin; business logic belongs in services/use cases.
- Features should reuse core guards, filters, decorators, validation, and error patterns.
- Data access must follow the existing repository/data-access patterns.
- Do not add Prisma fields or migrations without documenting schema/API/test impact.

### Frontend

- `apps/web/admin`, `apps/web/partner`, `apps/web/customer`: app shells and composition.
- `libs/web/core/*`: shared web capabilities such as auth, HTTP, platform, common utilities, and testing.
- `libs/web/config`: environment/config/style/tokens for web apps.
- `libs/web/ui`: shared UI/design-system components.
- `libs/web/admin`, `libs/web/partner`, `libs/web/customer`: persona-specific frontend logic.
- Use Angular standalone patterns for new code unless an existing local pattern requires otherwise.
- Keep SSR safety: guard browser-only APIs such as `window`, `document`, `localStorage`, and `ResizeObserver`.
- Avoid duplicating auth or HTTP logic across persona apps.

### Shared

- `libs/shared` must remain framework-agnostic where practical.
- Do not import Angular or NestJS into shared code.
- Keep shared DTO/enums/types serializable and safe for server/client use.

## Documentation and AIDD Lifecycle

AIDD work should follow this lifecycle for non-trivial changes:

```text
Requirement / issue
  -> inspect existing docs and code
  -> identify impacted apps/libs/contracts/schema/tests
  -> plan the smallest safe change
  -> update or confirm HLD/LLD/API/test-plan alignment
  -> implement
  -> add or update tests
  -> run targeted Nx validation
  -> summarize result and risks
```

HLD documents capture system vision, major modules, responsibilities, boundaries, key flows, non-functional requirements, assumptions, risks, and open questions.

LLD documents capture code-adjacent implementation details: components/classes/services, DTOs, API contracts, schema impact, validation, errors, security handling, sequence/state flows, and test strategy.

Keep HLD, LLD, API contracts, test plans, and implementation traceable.

## Build, Test, and Development Commands

Prefer targeted commands first:

```powershell
npx nx lint <project>
npx nx test <project>
npx nx build <project>
```

Useful npm scripts from `package.json` include:

```powershell
npm run lint:affected
npm run test:affected
npm run build:affected
npm run lint
npm run test
npm run build
npm run format:check
```

Auth API contract checks:

```powershell
npm run openapi:lint:auth
npm run openapi:check:auth
```

Nx graph and project discovery:

```powershell
npm run nx:graph
npx nx show projects
npx nx show project <project>
```

## Testing Rules

- Unit tests are usually `*.spec.ts` colocated with source under `src`.
- Server integration tests use the project’s established integration-test layout and Nx configurations.
- When behavior changes, add or update regression tests.
- Prefer typed mocks over `any`.
- Do not weaken coverage thresholds or skip tests to make validation pass.
- When tests cannot be run, state exactly why.

## Coding Style and API Shape

- Follow the repository’s current ESLint and Prettier configuration.
- Use single quotes and semicolons where existing code does.
- Avoid anonymous object shapes in public APIs; prefer named interfaces/types/DTO classes.
- NestJS DTOs should use explicit validation and documented properties where appropriate.
- Do not expose persistence entities directly as API responses.
- Use mappers where existing patterns require DTO/entity/model separation.
- Dates crossing API boundaries should be UTC ISO-8601 strings unless an existing contract says otherwise.
- Money/decimal values should preserve precision according to the existing contract.

## Security Rules

- Never log secrets, OTPs, reset tokens, refresh tokens, or credentials.
- Reuse existing auth, CSRF, cookie, validation, throttling, and error-handling patterns.
- Do not weaken guards, CORS, CSRF, validation, rate limits, or token handling without explicit approval and documentation.
- Security-impacting changes require tests and documentation.

## Commit and PR Policy

- Use Conventional Commits, for example `docs(aidd): add Codex operating model`.
- Prefer branch names such as `docs/codex-aidd-setup`, `fix/<short-description>`, or `feature/<short-description>`.
- Do not merge without user approval.
- PR descriptions must include summary, files changed, validation, commands not run, risks, and follow-ups.

## Completion Report Format

Every completed task should report:

- Summary of changes.
- Files touched.
- Validation commands run and results.
- Commands not run and reason.
- Design/spec impact.
- Risks, assumptions, and follow-ups.

## Local Workspace Warning

GitHub-visible work may not include uncommitted local Windows changes under `E:\workspace\cthub-bsaas`. Before merging remote Codex changes, compare with the local workspace.
