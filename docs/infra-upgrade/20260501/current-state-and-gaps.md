# Current State And Gaps

Snapshot date: 2026-05-01.

Additional package-install observation date: 2026-06-21.

## Workspace Shape

The repository is an Nx monorepo with:

- API app: `apps/api`
- Web apps: `apps/web/admin`, `apps/web/customer`, `apps/web/partner`
- E2E apps: `apps/e2e/api`, `apps/e2e/web/*`
- Server libs: `libs/server/core`, `libs/server/contracts-auth`, `libs/server/data-access`, `libs/server/infrastructure`, `libs/server/features/*`
- Shared lib: `libs/shared`
- Web libs: `libs/web/*`

The root package is ESM-enabled:

```json
{
  "type": "module"
}
```

## Current Infrastructure Baseline

Current root-level notable versions:

| Area | Current |
|---|---:|
| Node engine | `>=18.0.0` |
| `.nvmrc` | `20.19.1` |
| npm package manager | `npm@10.8.2` |
| Nx | `21.3.11` / mixed `21.4.1` and `21.6.11` plugins |
| Angular | `20.1.x` runtime, `20.2.x` build/SSR |
| TypeScript | `5.8.3` |
| Jest | `30.x` |
| Angular test runner | Jest via `jest-preset-angular` |
| Backend test runner | Jest |
| ESLint | `9.32.0` |
| angular-eslint | present as `angular-eslint ^20.0.0` |
| Prisma | `6.x` |
| NestJS | `11.x` |

Observed `nx report` output on Windows after regenerating `node_modules` showed this mixed Nx package state:

| Package | Observed version |
|---|---:|
| `nx` | `21.3.11` |
| `@nx/js` | `21.4.1` |
| `@nx/jest` | `21.3.11` |
| `@nx/eslint` | `21.3.11` |
| `@nx/workspace` | `21.3.11` |
| `@nx/angular` | `21.6.11` |
| `@nx/devkit` | `21.6.11` |
| `@nx/module-federation` | `21.6.11` |
| `@nx/nest` | `21.6.11` |
| `@nx/rspack` | `21.6.11` |
| `@nx/web` | `21.6.11` |
| `@nx/node` | `21.3.11` |
| `@nx/webpack` | `21.3.11` |

Nx reported that these packages should match the installed `nx` version and recommended `nx migrate nx@21.6.11` for that local state. Treat this as a stabilization signal, not as a replacement for the planned Nx 22 migration target.

## Package Installation Stability Findings

A Windows install attempt using plain `npm install` hung for approximately one hour after deprecation warnings. Process inspection showed npm waiting on two `node ./bin/post-install` lifecycle child processes while separate Codex, MCP, Prisma MCP, ESLint MCP, and Nx commands were also running from workspace `node_modules` paths.

The install succeeded after:

1. stopping repo-bound background processes,
2. removing stale `node_modules` / local Nx and Angular caches,
3. running `npm install --ignore-scripts --timing --loglevel=verbose`, and
4. running `npm rebuild --foreground-scripts --timing --loglevel=verbose`.

The successful diagnostic install installed approximately 2,860 packages, generated a real `package-lock.json`, and reported 111 vulnerabilities at audit time. The rebuild completed successfully, with the slowest observed lifecycle scripts being `@prisma/client` postinstall and Nx postinstall.

Required action:

- Add package-install stabilization as an explicit pre-migration gate.
- Keep install and rebuild logs with the migration PR when they reveal lifecycle or timing behavior.
- Avoid running dependency repair while local MCP/Nx/Prisma processes are executing from project `node_modules`.
- Do not commit a lockfile generated from a known-bad mixed dependency tree except in a diagnostic branch or PR.

## Nx Discovery Problem

`node node_modules/nx/bin/nx.js show projects --json` currently fails in this tool environment because Nx plugin workers fail to start. The daemon also timed out before retrying with `NX_DAEMON=false`.

This must be treated as a migration checkpoint, not ignored. Before and after upgrading Nx:

- Run `nx reset`.
- Run project graph generation without daemon.
- Verify `nx show projects --json`.
- Verify `nx graph --print`.
- Verify plugin worker health in CI and local Windows PowerShell.
- Verify `npm ls nx @nx/angular @nx/js @nx/nest @nx/workspace` reports a single intended Nx version line before starting major migrations.

## Project Configuration Findings

Parsed `project.json` files show 33 projects.

Notable gaps:

| Finding | Impact | Required action |
|---|---|---|
| `libs/server/features/auth` has `package.json` but is missing from root `workspaces` | npm workspace metadata is incomplete | Add or intentionally remove package boundary; prefer adding if it is a buildable package |
| `libs/server/infrastructure` has `package.json` but is missing from root `workspaces` | npm workspace metadata is incomplete | Add or intentionally remove package boundary; prefer adding if it is a buildable package |
| `server-contracts-auth` has no explicit `lint` target | Boundary and style checks may not run via project target | Add lint target or rely on inferred lint only after Nx inference is validated |
| `server` project has no tags | Boundary rules cannot classify it | Decide whether `libs/server` aggregator remains; tag or remove if obsolete |
| Several web apps use `sourceRoot: "src"` | Non-standard for Nx workspace-root project metadata | Align to `apps/web/<app>/src` unless current executor requires project-root-relative paths |
| Web app build output paths use `dist/apps/admin` while tsconfig uses `dist/apps/web/admin` | Output conventions are inconsistent | Standardize to `dist/apps/web/<app>` |
| Mixed project tags do not consistently match `eslint.base.js` boundary constraints | Some constraints are ineffective or overly broad | Normalize tags before relying on boundary enforcement |
| `.eslintrc.json` still exists beside flat config | Legacy config can confuse editors/tooling | Remove or quarantine after confirming flat config fully covers the workspace |
| Root Jest preset forces CommonJS transform through `@swc/jest` | Not aligned with TS+ESM testing objective | Keep for backend initially; remove from frontend once Vitest is introduced |
| `jest-openapi ^6.0.0` is in `package.json` but absent from `package-lock.json` | Manifest/lockfile drift | Remove or replace with a valid installed package during dependency cleanup |

## Boundary And Tag Drift

Current root boundary rules expect tags such as:

- `type:app`
- `type:lib`
- `platform:web`
- `platform:server`
- `scope:shared`
- `layer:contracts`
- `type:core`
- `type:data`
- `type:infra`
- `type:feature`

But project tags are inconsistent. Examples:

- Web apps have `scope:web`, `type:app`, but not `platform:web`.
- Several web libs have `scope:web-core`, `type:data`, but not `type:lib` or `platform:web`.
- Many server feature libs have `scope:server-feature` but not `type:feature`.
- `server-feature-auth` is better tagged than other server feature libs and should be used as a reference.

The upgrade must include a tag normalization pass. Otherwise `@nx/enforce-module-boundaries` cannot be trusted.

## Testing Current State

Current testing is Jest-centered:

- Root `nx.json` registers `@nx/jest/plugin`.
- Frontend apps and web libs use `@nx/jest:jest`.
- Angular tests use `jest-preset-angular`.
- Server unit and integration tests use Jest.
- Server feature tests have UT/IT split configurations.

The agreed migration stance is:

- Migrate Angular/web tests to Vitest.
- Keep backend NestJS unit/integration/API e2e tests on Jest in the first iteration.
- Consider shared pure TypeScript tests for Vitest after frontend migration is stable.

## Angular ESLint Current State

`angular-eslint` is already present. Web ESLint config uses `eslint.base.web.js`, which includes:

```js
...nx.configs['flat/angular'],
...nx.configs['flat/angular-template']
```

The upgrade should therefore update and tighten angular-eslint, not introduce it from zero.

Required refinement:

- Upgrade to Angular 21-compatible angular-eslint.
- Remove duplicated per-app warning-level TypeScript relaxations where they weaken strictness.
- Confirm template linting runs for all `*.html` files in apps and web libs.
- Confirm selector rules are consistently configured across all web projects.

## Security Posture Findings

Security-relevant upgrade targets exist:

- Node runtime should move from Node 20 `.nvmrc` / Node 18-compatible engine to Node 24 LTS or a controlled `>=22 <25` transition range.
- CI workflow currently uses Node 18 in `.github/workflows/openapi-contract.yml`; this must be raised.
- `helmet`, `jsonwebtoken`, `bcryptjs`, `@simplewebauthn/server`, `google-auth-library`, `ioredis`, Prisma, and NestJS all have available updates.
- Express 5 is available but should be handled as a compatibility spike because NestJS platform behavior and middleware typings can be affected.
