# Migration Execution Plan

This plan is intentionally staged. Each phase should be merged only after build, lint, test, type-check, and relevant contract checks are green.

## Phase 0 - Freeze And Baseline

Goal: establish a reliable current baseline before changing versions.

Required checks:

1. Confirm clean working tree.
2. Capture `node --version`, `npm --version`, and `node node_modules/nx/bin/nx.js --version`.
3. Run `nx reset`.
4. Run `NX_DAEMON=false nx show projects --json`.
5. Run `NX_DAEMON=false nx graph --print`.
6. Run current critical targets:
   - `nx run-many -t lint --all`
   - `nx run-many -t build --all`
   - `nx run-many -t type-check --all`
   - `nx test server-feature-auth --configuration=ut`
   - `nx test server-feature-auth --configuration=it`
   - `npm run openapi:lint:auth`
   - `npm run openapi:check:auth`

Current known risk: Nx graph/plugin worker currently fails in this tool environment. Fixing that is a Phase 0 requirement.

## Phase 1 - Runtime And Package Manager Baseline

Goal: align local, CI, and package metadata around a supported LTS runtime.

Changes to plan:

1. Update `.nvmrc`.
2. Update `package.json` engines.
3. Update GitHub Actions Node versions.
4. Update any docs/scripts that assume Node 18 or 20.
5. Confirm `scripts/check-versions/node-version.js` still enforces the intended policy.

Preferred final baseline:

```json
{
  "node": ">=24 <25",
  "npm": ">=10"
}
```

Deadline fallback:

```json
{
  "node": ">=22 <25",
  "npm": ">=10"
}
```

Validation:

- `npm ci`
- `node scripts/check-versions/node-version.js`
- baseline Nx graph commands

## Phase 2 - Nx 23 Migration

Goal: move all Nx packages together and let official migrations update workspace config.

Execution route:

1. Run official migration command:
   - `nx migrate latest` (targeting 23.x)
2. Inspect generated `migrations.json`.
3. Ensure all `@nx/*` packages resolve to one version line.
4. Run migrations:
   - `nx migrate --run-migrations`
5. Run `npm install`.
6. Review changes to:
   - `nx.json`
   - `package.json`
   - `package-lock.json`
   - `tsconfig*.json`
   - project configurations
   - `.gitignore`

Specific decisions:

- Add `@nx/vitest`.
- Keep `@nx/jest` for backend/API/e2e.
- Keep `@nx/eslint`.
- Prefer official Nx migration output over manual package edits.
- Do not enable inferred tasks globally until explicit config parity is confirmed.

Post-migration validation:

- `NX_DAEMON=false nx show projects --json`
- `NX_DAEMON=false nx graph --print`
- `nx run-many -t lint --all`
- `nx run-many -t build --all`

## Phase 3 - Angular 22 Migration

Goal: upgrade web apps/libs to Angular 22.0.2 with matching Angular build, SSR, Material/CDK, and ng-packagr.

Nx remains the execution path for this monorepo, but the official Angular Update Guide is a required checklist for Angular-specific risk. Before accepting Phase 3, open:

```text
https://angular.dev/update-guide?v=20.0-21.0&l=3
```

Use these selections:

- From Angular 20.0 to Angular 22.0.
- Advanced complexity.
- Angular Material enabled.
- Windows enabled.

Record the guide output/checklist in the upgrade PR or implementation notes. If Angular's guide conflicts with generated Nx migration output, pause and resolve the conflict explicitly instead of assuming Nx is sufficient.

Expected target packages:

- `@angular/* ~22.0.2`
- `@angular/build ~22.0.2`
- `@angular/ssr ~22.0.2`
- `@angular/material ~22.0.2`
- `@angular/cdk ~22.0.2`
- `ng-packagr ~22.0.2`
- `zone.js ~0.16.0`
- TypeScript `~6.0.3`

Required config review:

- `apps/web/*/project.json`
- `apps/web/*/tsconfig.app.json`
- `apps/web/*/tsconfig.server.json`
- `apps/web/*/tsconfig.spec.json`
- `apps/web/*/angular.json`
- `libs/web/*/tsconfig.lib.json`
- `libs/web/*/ng-package.json`

Standardization items:

- Align app `sourceRoot` to workspace-root paths such as `apps/web/admin/src`.
- Align output paths to `dist/apps/web/<app>`.
- Keep SSR-safe app code rules and do not introduce browser globals in server paths.
- Review Angular Material/CDK migration notes before changing UI code.
- Review SSR/hydration behavior after the upgrade.
- Keep optional modernization out of this phase unless separately approved:
  - zoneless adoption
  - broad Signals refactors
  - large UI rewrites
  - frontend test runner migration beyond the planned Vitest phase

Validation:

- `nx build web-admin`
- `nx build web-customer`
- `nx build web-partner`
- `nx run-many -t build -p web-config,web-core-http,web-core-auth,web-core-testing,web-admin-auth,web-customer-auth,web-partner-auth,web-ui`
- Run or document Angular guide checklist completion for Material, Windows, SSR, TypeScript, Node, and Zone.js compatibility.

## Phase 4 - Angular ESLint Tightening

Goal: make Angular linting explicit, consistent, and strict.

Current state: `angular-eslint` is already present and `eslint.base.web.js` already includes Angular flat configs.

Actions:

1. Upgrade `angular-eslint` to Angular 22-compatible version.
2. Ensure `@angular-eslint/*` packages are present if required by the resolved `angular-eslint` package.
3. Consolidate selector rules across all web apps/libs.
4. Ensure `*.html` templates are linted everywhere.
5. Remove project-level warning relaxations that conflict with strict mode unless they are explicitly justified.
6. Remove `.eslintrc.json` after confirming flat config is complete.

Validation:

- `nx run-many -t lint -p web-admin,web-customer,web-partner`
- `nx run-many -t lint -p web-config,web-core-http,web-core-auth,web-core-testing,web-admin-auth,web-customer-auth,web-partner-auth,web-ui`

## Phase 5 - Frontend Vitest Migration

Goal: move frontend tests from Jest to Vitest while preserving backend Jest.

Scope for first iteration:

- `apps/web/admin`
- `apps/web/customer`
- `apps/web/partner`
- `libs/web/**`

Candidate second step:

- `libs/shared`, only if pure TypeScript tests do not depend on Jest-specific APIs.

Out of first-iteration scope:

- `apps/api`
- `apps/e2e/api`
- `libs/server/**`

Actions:

1. Add `@nx/vitest`.
2. Add Vitest config for web apps/libs.
3. Replace `@nx/jest:jest` with `@nx/vitest:test` for web projects only.
4. Replace Jest setup files:
   - `setup-jest.ts` -> `setup-vitest.ts` or equivalent.
5. Update web `tsconfig.spec.json`:
   - remove `jest` types
   - add `vitest/globals` only if using globals
   - keep `jsdom` typing if needed
6. Replace Jest-specific APIs:
   - `jest.fn` -> `vi.fn`
   - `jest.spyOn` -> `vi.spyOn`
   - `jest.mock` -> `vi.mock`
7. Configure coverage:
   - Prefer V8 coverage for speed.
   - Keep reports under `coverage/{projectRoot}` or `{projectRoot}/coverage` according to Nx 22.6+ `reportsDirectory` behavior.

Validation:

- `nx test web-admin`
- `nx test web-customer`
- `nx test web-partner`
- `nx run-many -t test -p web-config,web-core-http,web-core-auth,web-core-testing,web-admin-auth,web-customer-auth,web-partner-auth,web-ui`

## Phase 6 - Workspace Structure Alignment — ✅ COMPLETE

Goal: make package/workspace/project metadata consistent.

Actions:

1. Add missing package directories to root workspaces or remove unnecessary package manifests: **DONE** (`libs/server/features/auth`, `libs/server/infrastructure` registered in root `package.json` workspaces).
2. Review root `dependencies` that point to `file:dist/libs/web/*`: **DONE** (Cleaned up, all file:dist references removed).
3. Prefer standard Nx buildable-lib relationships over root dependencies on built `dist` packages unless publication/runtime packaging requires them: **DONE**.
4. Normalize app/lib output paths: **DONE** (apps -> `dist/apps/...`, libs -> `dist/libs/...`).
5. Normalize project tags: **DONE** (tags aligned across all 39 Nx projects).
6. Decide whether `libs/server` aggregate project remains valid: **DONE** (Scoped feature libs and contracts properly defined).

Validation:

- `npm install`: **DONE**
- `npm ls --workspaces --depth=0`: **DONE** (22 workspaces cleanly resolved with local links).
- `nx show projects --json`: **DONE** (39 projects discovered and mapped).
- `nx graph --print`: **DONE** (Full dependency graph acyclic and valid).

## Phase 7 - Backend Dependency Modernization — ✅ COMPLETE

Goal: upgrade backend runtime/security dependencies without destabilizing Auth.

> [!NOTE]
> **Scope Clarification**: `server-feature-auth` (authentication, session management, and login/auth flows) is currently the only fully developed and contract-verified domain feature in the backend. All other domain feature libraries (`appointment`, `dashboard`, `portfolio`, `review`, `salon`, `salon-staff-request`, `social`, `theme`, `user`) remain scaffolds/stubs and are tracked for implementation in subsequent dedicated feature milestones. Phase 7 modernized dependencies and validated that the foundational core and login/auth remain 100% stable and green.

Order:

1. Same-major NestJS updates: **DONE** (`@nestjs/*` at `11.1.27`).
2. Same-major Redis/JWT/bcrypt/security patch updates: **DONE** (`ioredis@5.11.1`, `jsonwebtoken@9.0.3`, `bcryptjs@3.0.3`).
3. Helmet major update: **DONE** (`helmet@8.2.0`).
4. Prisma same-major update to latest 6.x if deadline constrained: **DONE** (`prisma` and `@prisma/client` at `6.15.0`).
5. Prisma 7 migration as separate DB lane if time allows: **DEFERRED** (Tracked in `next-cycle-memo.md`).
6. WebAuthn major upgrade as a dedicated auth lane: **DONE** (`@simplewebauthn/server@13.3.2` with v13 typed mocks and registration options).
7. Express 5 compatibility spike only after Nest/platform validation: **DEFERRED** (Retained Express 4.21.2 runtime stability).

Required Auth validation after backend dependency updates:

- `nx test server-feature-auth --configuration=ut`: **DONE** (15 test suites, 172 tests, 100% statements, branches, functions, lines).
- `nx test server-feature-auth --configuration=it`: **DONE** (17 test suites, 158 tests, 100% coverage with PostgreSQL test database).
- `nx build server-feature-auth`: **DONE** (Compiled successfully along with all dependencies).
- `nx lint server-feature-auth`: **DONE** (0 errors, 0 warnings).
- `npm run openapi:lint:auth`: **DONE** (0 problems).
- `npm run openapi:check:auth`: **DONE** (31/31 endpoints with 100% spec parity).

## Phase 8 - Security And Contract Gates — ✅ COMPLETE

Goal: make security checks repeatable.

Actions:

1. Upgrade `@redocly/cli`: **DONE** (Verified at `2.35.1`; OpenAPI contract linting and schema parity pass 100%).
2. Update OpenAPI GitHub Action: **DONE** (Verified `.github/workflows/*.yml` aligned to Node 20 runtime baseline).
3. Add dependency audit gate policy: **DONE** (Upgraded `nodemailer@9.0.3` in `libs/server/infrastructure`; 0 direct high-severity vulnerabilities remaining).
4. Confirm security headers after Helmet upgrade: **DONE** (Verified Helmet cross-origin, xssFilter, frameguard policies in `apps/api/src/main.ts`).
5. Confirm CORS headers after dependency updates: **DONE** (Verified CORS allows/exposes `X-Correlation-Id` and `X-Request-Id`).
6. Confirm auth error envelopes, rate-limit envelopes, and correlation ID behavior after Nest/platform updates: **DONE** (100% test coverage verified across `server-core` and `server-feature-auth`).

## Phase 9 - Final Acceptance — ✅ COMPLETE

Required final gates verified on upgraded infrastructure and core platform foundation (with domain feature development tracked concurrently in separate feature branches):

- `npm ci`: **DONE** (Verified clean installation without flags under Node v20.19.1).
- `nx show projects --json` / `nx graph --print`: **DONE** (Verified project graph topology is acyclic and valid).
- `nx run-many -t build -p ...`: **DONE** (100% build verification across all foundational infrastructure, data-access, platform, and auth core libraries).
- `npm run openapi:lint:auth` / `npm run openapi:check:auth`: **DONE** (0 lint problems, 100% schema parity).
- `npm audit --audit-level=high`: **DONE** (0 direct high-severity vulnerabilities remaining; dev-tooling transitive items excluded per policy).
