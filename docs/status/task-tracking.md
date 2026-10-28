# Task Tracking

**Updated:** 2026-05-20

This document tracks current repository-level planning status. Feature-specific status documents remain under their own folders.

## Completed Workstreams

| Workstream                                 | Status | Notes                                                                                                                                                                                                                                                    |
| ------------------------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth backend foundation                    | Done   | Backend Auth implementation, OpenAPI/controller parity, UT/IT coverage gates, and supporting server-core pieces are complete for the current scope.                                                                                                      |
| Frontend restructuring foundation          | Done   | Foundation restructuring branch was completed and merged.                                                                                                                                                                                                |
| Salon Owner user-story baseline            | Done   | `docs/us/salon-owner/**` and supporting project-level US docs are the current product baseline.                                                                                                                                                          |
| Salon Owner MVP HLD/LLD baseline           | Done   | `docs/specs/salon-owner/**` is the current implementation-planning baseline.                                                                                                                                                                             |
| Project-wide documentation PR stack        | Done   | PRs #29 through #37 were merged and now define project-wide specs, live Penpot wireframe board references, reconciliation, and readiness review.                                                                                                         |
| Documentation standards                    | Done   | Production documentation and visual collaboration guidelines exist under `docs/quality-standards/**`.                                                                                                                                                    |
| Live Penpot boards                         | Done   | Live Penpot boards were created after Penpot MCP token regeneration. Board IDs are recorded in the relevant wireframe specs across the project-wide PR stack.                                                                                            |
| Project-wide supporting OpenAPI            | Done   | `docs/specs/project-wide/API/openapi.yaml` defines the supporting target contract, `docs/specs/project-wide/API/schema-catalog.md` defines operation DTO content, and Redocly lint passes.                                                               |
| Project implementation slicing             | Done   | `docs/specs/project-wide/IMPLEMENTATION/implementation-slicing.md` defines sequencing, branch strategy, project boundaries, and validation gates.                                                                                                        |
| Infrastructure upgrade: Nx 24 & Angular 22 | Done   | Upgraded workspace to Nx 24.0.1 and Angular 22.2.4 on `chore/nx24-angular22-upgrade`. Preserved NestJS 11 + Jest and Prisma ORM 6.15.0 baselines (100% UT/IT coverage). Full report in `docs/infra-upgrade/20261026-nx24-angular22/migration-report.md`. |

## Active Planning Backlog

| Task                                 | Status   | Notes                                                                                                                                      |
| ------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Legacy spec deletion review          | Done     | Legacy supporting folders were reconciled into current production-level docs or preserved as future-scope user-story intent, then removed. |
| Server-wide coverage gate            | Deferred | Add only after more server feature libraries are developed.                                                                                |
| Additional import-boundary hardening | Deferred | Tracked by the infrastructure-upgrade planning workstream.                                                                                 |

## Validation References

For Auth backend changes:

```powershell
npx nx test server-feature-auth --configuration=ut
npx nx test server-feature-auth --configuration=it
npx nx lint server-feature-auth
npx nx build server-feature-auth
node_modules/.bin/redocly.cmd lint docs/specs/auth/API/openapi.yaml --config .redocly.yaml --max-problems=0
node_modules/.bin/tsx.cmd scripts/openapi-auth-check.ts
```

For Salon Owner documentation changes:

```powershell
git diff --check
```

Also verify local Markdown links for changed docs before committing large documentation updates.
