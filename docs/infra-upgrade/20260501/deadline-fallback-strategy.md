# Deadline Fallback Strategy

This file defines what to do if the full upgrade cannot be completed before the next major release cycle or the planned deadline.

## Guiding Rule

Do not force all major upgrades into one unstable change set. Preserve a green build/test/lint baseline at every checkpoint.

## Priority Levels

## P0 - Must Complete

These are required for a credible infra modernization iteration.

1. Fix Nx graph/plugin-worker reliability.
2. Move runtime baseline away from Node 18 support.
3. Upgrade Nx packages together to one stable version line.
4. Normalize Nx project metadata enough that `nx show projects` and `nx graph` work.
5. Keep backend Jest tests passing.
6. Keep Auth UT/IT at required coverage.
7. Keep OpenAPI contract checks passing.
8. Ensure angular-eslint remains present and Angular 21-compatible if Angular is upgraded.
9. Update CI Node version.

## P1 - Should Complete

These deliver the main strategic value.

1. Upgrade Angular to 21.2.
2. Migrate frontend unit tests to Vitest.
3. Add `@nx/vitest` and cleanly scope Jest/Vitest plugins.
4. Normalize project tags and boundary rules.
5. Align app output paths and source roots.
6. Clean root workspace package metadata.
7. Upgrade same-major backend dependencies.
8. Upgrade Redocly and OpenAPI workflow.

## P2 - Can Defer

These are valuable but should not block the first stable upgrade if time is tight.

1. Prisma 7 migration.
2. Express 5 migration.
3. `@simplewebauthn/server` major migration.
4. `google-auth-library` major migration.
5. `ng2-charts` major migration.
6. Convert backend Jest to Vitest.
7. Fully adopt Nx inferred tasks if explicit targets are currently safer.
8. Enable `banTransitiveDependencies` if package metadata cleanup is incomplete.

## Fallback Version Strategy

If full latest stable migration is not viable:

| Area | Full target | Fallback |
|---|---:|---:|
| Node | 24 LTS only | `>=22 <25` |
| Nx | latest stable at execution time | latest stable Nx 22 patch |
| Angular | 21.2 | latest Angular 20.3 patch |
| TypeScript | `~5.9.2` | keep Angular-compatible TS 5.8.x for Angular 20 fallback |
| Vitest | web tests on Vitest 4 | pilot one web lib only |
| Prisma | 7.x | latest 6.x |
| Express | 5.x after spike | keep 4.21.x |
| WebAuthn | 13.x | keep current until dedicated auth migration |

## Stop Conditions

Stop and split the work if any of these occur:

- Nx graph remains unreliable after Nx 22 migration.
- Angular build fails across more than one app due to framework-level migration issues.
- Frontend Vitest migration requires broad app test rewrites.
- Backend Auth UT or IT coverage drops below policy.
- Prisma migration requires schema/client changes beyond dependency upgrade.
- Express 5 changes request/response/middleware semantics.
- Security behavior changes without clear test coverage.

## Minimum Acceptable First Iteration

If the full plan cannot fit, the minimum acceptable first iteration is:

1. Node baseline updated to `>=22 <25`.
2. Nx moved to a single stable 22.x line.
3. Angular remains on 20.3 latest patch or moves to 21.2 if clean.
4. angular-eslint remains active and compatible.
5. Backend stays on Jest with green Auth UT/IT.
6. Frontend Vitest pilot is completed for one low-risk web lib or deferred with documented blocker.
7. All CI/documented commands are updated to avoid stale Node 18 assumptions.

