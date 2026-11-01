# Repository Guidelines

## How To Use These Instructions

These guidelines apply to AI coding assistants and human developers. Work from the repository root, and read the nearest relevant instruction file before working in a scoped area:

| Work area                      | Read this first                                                     |
| ------------------------------ | ------------------------------------------------------------------- |
| `libs/server/**`               | `libs/server/AGENTS.md`                                             |
| `libs/server/features/auth/**` | `libs/server/AGENTS.md`, then `libs/server/features/auth/AGENTS.md` |
| `libs/web/**`                  | `libs/web/AGENTS.md`                                                |
| `libs/shared/**`               | `libs/shared/AGENTS.md`                                             |
| `apps/api/**`                  | `libs/server/AGENTS.md`, then `apps/api/AGENTS.md`                  |
| `apps/e2e/**`                  | `apps/e2e/AGENTS.md`                                                |
| `docs/**`                      | `docs/AGENTS.md`                                                    |
| AIDD/Codex process work        | `docs/aidd/README.md`                                               |

Root instructions define global safety, workflow, and repository conventions. Scoped `AGENTS.md` files define domain rules and override root rules only for their area.

## Startup Checklist

1. Use the actual local checkout directory as your project root.
2. Prefer MCP tools over raw shell when they exist.
3. Keep approvals `on-request` unless the user changes it.
4. Confirm runtime environment before commands that depend on OS, shell, Node, npm, database, or network state.
5. Check `git status --short` before editing or committing.
6. Compare checked-out package and Nx configuration with version claims in these instructions. Run `npm run aidd:instruction-drift` for AIDD or platform changes; report any mismatch.

## AIDD Default Policy

AIDD is the default workflow for every new task, including a new error-fix request. A request such as "fix this error" is still a new task unless it is explicitly part of an already-running implementation session.

The [AI-driven development life cycle](docs/aidd/development-lifecycle.md) defines the product goal, role ownership, handoffs, and release gates for both Codex and Antigravity. Reuse an existing issue when the work continues it; use one issue for a standalone deliverable and an Epic only for a multi-slice outcome. Independent review and security checks belong to Codex. Antigravity execution requires Gemini 3.8 Flash or stronger; verify the effective model because an agent's `flash` tier does not pin a version.

Add each trackable delivery issue to the private cthub GitHub Project with a Status. A feature needs child issues only for independent delivery slices with their own acceptance criteria and PRs, not for each agent, layer, or internal work unit. The coordinator owns Project field updates; see `docs/aidd/development-lifecycle.md` and `.agents/skills/aidd-project-tracker/SKILL.md`.

For long-running or multi-agent work, use the [AIDD recovery protocol](docs/aidd/autonomous-recovery.md): initialize bounded work units before dispatch, checkpoint each reviewable increment, and recover interrupted units from the local ledger. Publish process state to the private tracking issue and source state to the dedicated private Git ref when progress must survive loss of the checkout. A partial or stale checkpoint is not completion evidence.

For every new task, the active agent must:

1. Read this root `AGENTS.md` and the nearest scoped `AGENTS.md` for the touched area.
2. Read `docs/aidd/README.md` and follow the applicable AIDD guide or prompt template.
3. Inspect relevant docs and code before editing, and identify the work item's product outcome and acceptance criteria when applicable.
4. Produce a short plan before non-trivial edits.
5. Keep design/spec/API/validation/test documents aligned when behavior or contracts change.
6. Run the narrowest meaningful validation command, or report exactly why validation was not run.

A lighter path is allowed only for a continuation fix inside the same active task, for example correcting a lint/test/build error produced by the current change. Even then, the agent must preserve the AIDD trace, avoid broad refactors, and report the validation result.

## Safe Filesystem Usage

- Stay inside the repository unless explicitly told otherwise.
- A sibling Git worktree under the same approved workspace parent is allowed only after the user authorizes its location and any branch creation. Follow `docs/aidd/parallel-worktrees.md`; verify its resolved path before removal.
- Never call `filesystem.directory_tree` on the repo root.
- For top-level structure, use a depth-1 listing.
- Drill down one folder at a time.
- To find files, prefer narrow search patterns.
- Do not include raw listings over 200 lines in messages; summarize instead.
- Use `rg` for search when available; on Windows, use PowerShell-native commands when POSIX tools are unavailable.

## MCP Preference And Fallbacks

- Prisma: use Prisma MCP tools for schema, migrations, and local data. Fallback to Prisma CLI only if MCP is unavailable.
- Postgres: use `postgres.query` for SQL. Fallback to `psql` only with explicit approval.
- ESLint: use `eslint.lint-files` for lint/fix tasks. Fallback to `npx eslint` if unavailable.
- Git: prefer Git MCP tools when available. Fallback to shell `git` when needed.
- Filesystem: prefer filesystem MCP tools for read/write/search inside the repo. Fallback to shell for cases MCP cannot express.

## Environment And Shell

- Windows shell: prefer PowerShell Core (`pwsh`) when available.
- Use `Get-Content` instead of `sed` for quick file reads on Windows.
- Use forward slashes in Nx targets; PowerShell accepts them.
- Server integration tests require the isolated test database configured through `.env.test` or an approved `TEST_DATABASE_URL`.

## Dependencies And Package Installation

- Follow `docs/aidd/dependency-policy.md` for installs, removals, updates, pruning, audits, and PR evidence.
- Match engines in `package.json` and `.nvmrc`.
- Node and npm must be compatible with the repo before running builds/tests.
- Server integration tests require the isolated database in `docker-compose.test.yml` with `.env.test`, or an explicitly approved `TEST_DATABASE_URL`; never use a general Prisma `.env` file as their target.
- Database operations follow `docs/aidd/database-access-policy.md`. Automated tests use only a validated test target; database tools do not bypass profile and authorization rules.
- **NEVER EVER use `--legacy-peer-deps`** when installing or updating any package. Peer dependency conflicts must be resolved cleanly by matching compatible package versions in `package.json`, never bypassed, forced, or silenced with `--legacy-peer-deps`.
- Do not use dependency-changing `--force`, disable the lockfile, or make an unsaved project dependency change. Review new install scripts and run the dependency policy check.

## Project Snapshot

- Monorepo: Nx 24.
- Backend: NestJS 11.
- Frontend: Angular 22, standalone + SSR, Angular Material v3, Tailwind v4.
- Tests: Jest 30 and Vitest 4; inspect the affected project's test target before choosing a command.
- Apps: backend API under `apps/api`; Angular runnable wrappers under `apps/web/**`; E2E under `apps/e2e/**`.
- Libraries: main implementation lives under `libs/**`.
- TypeScript path aliases are defined in `tsconfig.base.json`.

## Build, Test, And Development

- Build: `npx nx build <project>`
- Type check: `npx nx run <project>:type-check`
- Lint: `npx nx lint <project>`
- Test: `npx nx test <project>`
- Affected: `npx nx affected -t build,test,lint`

Use Nx for workspace tasks. If an Nx command fails, inspect project/target configuration before falling back to underlying tools.

## Docs And Specs

- User stories: `docs/us/<feature>`
- Specs/design/API contracts: `docs/specs/<feature>`
- Status and branch tracking: `docs/status/**`
- Infrastructure planning: `docs/infra-upgrade/**`
- Codex/AIDD operating guidance: `docs/aidd/README.md`

Keep specs and implementation aligned. Cross-link PRs to relevant user stories and specs when applicable.

## Coding Style

Follow the [AIDD change scope and validation matrix](docs/aidd/change-hygiene.md) for inclusion, exclusion, and checks by changed area.

- TypeScript strict.
- ES modules.
- Prettier/ESLint formatting.
- Post-edit checks: format touched files supported by Prettier. Lint touched TypeScript/JavaScript files with the affected Nx lint target or scoped ESLint when needed. Report warnings and non-fatal lint issues explicitly; do not silently ignore them.
- 2-space indent.
- Single quotes.
- File names: `kebab-case.ts`.
- Types/classes: `PascalCase`.
- Values/functions: `camelCase`.
- Default to ASCII in edits unless the existing file or domain clearly requires otherwise.

## Type And API Shape Rules

- Avoid anonymous object shapes in public APIs.
- For server functions, extract parameter or return objects with 3 or more properties to a named interface/type or DTO class.
- For client functions, any object parameter or object return should use a named interface/type/model/DTO.
- Consolidate 3 or more primitive parameters into a named parameter object.
- Dates at API boundaries use UTC ISO-8601 strings.
- Money/decimal values at API boundaries use strings.
- Prefer UUIDv4 string IDs and clear domain aliases where helpful.
- Centralize mappers in `*-mappers.ts`.
- Mappers must omit secrets and internal-only fields by default.

## Authorization And Capability Contracts

- **Full-Slice Implementation**: When introducing or enforcing any authorization capability, claim, or user-context property, implement the complete vertical slice from database/repository to consumer.
- **Producer-Consumer Parity**: Never gate a consumer (guard, UI route, or API handler) on an optional field without verifying or implementing its active production producer (database query, token generator in `AuthService`, and session hydration).
- **No Mock-Only Validation**: Unit tests using hand-crafted mock user objects with pre-populated capabilities are insufficient on their own; at least one integration test must verify that the actual sign-in or token-generation pipeline produces those claims.

## Git And Commits

- Do not commit unless the user explicitly instructs you to commit.
- The user has authorized one standing exception for AIDD recovery: `npm run aidd:source-checkpoint -- apply <task-id>` may create and push a private commit only to `refs/aidd/checkpoints/<task-id>`. It must preserve the current branch and normal index, verify the private remote, and reject likely secrets. This does not authorize normal branch commits, pushes, PR merges, or releases.
- Commit authorization is scoped to the immediately preceding task only.
- Before committing, show or inspect the staged set.
- Do not revert user changes unless explicitly requested.
- Conventional commits: `feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`.
- Surface diffs before committing large changes.

## Branching

- Never create or switch branches without explicit user confirmation.
- Branch naming: `<type>/<short-description>`.
- Allowed type examples: `feature`, `fix`, `chore`, `docs`, `test`, `refactor`, `style`.
- Short description: lowercase kebab-case, 50 characters or fewer.
- `ci/<short-description>` is also allowed. A separately maintained release branch uses `release/vMAJOR.MINOR.PATCH`; release tags use `vMAJOR.MINOR.PATCH`. Follow the merge and issue-link policy in `docs/aidd/development-lifecycle.md`.
- Parallel delivery slices follow `docs/aidd/parallel-worktrees.md`: one branch and worktree per independent slice, with no branch per agent. The coordinator owns integration and Git operations when multiple agents share one slice.

## Security, Secrets, And Config

- Do not commit secrets.
- Use env files or secret managers.
- Prefer free-tier services and OSS tooling where practical.
- Prisma schema/migrations live under the server data-access area; commit meaningful migrations.
- High-stakes security, dependency, or legal claims require current official documentation.

## Common Task Shortcuts

- Prisma status: use Prisma MCP `migrate-status` and summarize drift/unapplied migrations.
- Prisma data inspection: use Prisma MCP Studio for local test DB inspection.
- ESLint: use ESLint MCP to lint/fix scoped paths when available.
- Git: use Git MCP to stage/commit/push when available.
- Postgres: use Postgres MCP for SQL and report only necessary results.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e., `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
