# Repository Structure

This is a navigation guide for the Nx monorepo. For role-specific read and write scope, use [Role and Directory Access](aidd/role-directory-access.md); for the current product outcome and delivery stages, use [Development Life Cycle](aidd/development-lifecycle.md). The nearest `AGENTS.md` and the affected project's `project.json` provide the working rules and executable targets.

| Path                                                                                                            | Responsibility                                                                             |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `apps/api/**`                                                                                                   | NestJS application shell and global runtime wiring.                                        |
| `apps/web/{admin,partner,customer}/**`                                                                          | Angular and SSR application shells, routing composition, assets, and deployment packaging. |
| `apps/e2e/**`                                                                                                   | API and browser end-to-end test projects.                                                  |
| `libs/server/core/**`, `libs/server/contracts-*/**`, `libs/server/features/**`, `libs/server/infrastructure/**` | Backend cross-cutting code, ports, domain behavior, and concrete adapters.                 |
| `libs/server/data-access/**`                                                                                    | Prisma schema, migrations, data access, and related tests.                                 |
| `libs/web/{core,config,ui,admin,partner,customer,public}/**`                                                    | Shared client capabilities, UI, and persona features.                                      |
| `libs/shared/**`                                                                                                | Framework-independent code shared by client and server.                                    |
| `docs/us/**`, `docs/specs/**`, `docs/status/**`                                                                 | Product intent, current or planned contracts, and delivery evidence.                       |
| `docs/aidd/**`, `.agents/**`, `.codex/**`                                                                       | Shared AIDD process and provider-specific agent adapters.                                  |
| `.github/**`, `.husky/**`, `scripts/**`, `tools/**`                                                             | CI, hooks, automation, and test tooling.                                                   |

`docs/db/**`, `docs/bk/**`, and `docs/others/**` contain historical or supporting material. They do not override current specs, source, or migrations. `dist/**`, `coverage/**`, `logs/**`, `tmp/**`, `work/**`, and caches are local/generated state; use the [recovery protocol](aidd/autonomous-recovery.md) for durable handoffs.

## Working from this checkout

Use the Node version in `.nvmrc` and the engine range in `package.json`. Install from the lockfile with the [dependency policy](aidd/dependency-policy.md); the Codex worktree setup uses scripts-disabled `npm ci` and a toolchain smoke check. Read `project.json` before selecting an Nx target, and run workspace tasks through the repository package manager and Nx. For example, `npm exec nx run web-app-admin:build` targets the admin shell. Server integration and database-backed E2E tests use only the validated test database described in [Database Access Policy](aidd/database-access-policy.md).
