# Task Tracking

**Updated:** 2026-05-18

This document tracks current repository-level planning status. Feature-specific status documents remain under their own folders.

## Completed Workstreams

| Workstream | Status | Notes |
| --- | --- | --- |
| Auth backend foundation | Done | Backend Auth implementation, OpenAPI/controller parity, UT/IT coverage gates, and supporting server-core pieces are complete for the current scope. |
| Frontend restructuring foundation | Done | Foundation restructuring branch was completed and merged. |
| Salon Owner user-story baseline | Done | `docs/us/salon-owner/**` and supporting project-level US docs are the current product baseline. |
| Salon Owner MVP HLD/LLD baseline | Done | `docs/specs/salon-owner/**` is the current implementation-planning baseline. |
| Project-wide documentation PR stack | Open | PRs #29 through #36 define project-wide specs and reconciliation. Merge in order before treating them as main-branch source. |
| Documentation standards | Done | Production documentation and visual collaboration guidelines exist under `docs/quality-standards/**`. |

## Active Planning Backlog

| Task | Status | Notes |
| --- | --- | --- |
| Merge project-wide documentation PR stack | Next | Merge PRs #29 through #36 in order when ready. |
| Salon Owner and project implementation slicing | Next after docs merge | Create coding-ready backend/frontend slices before implementation. |
| Live Penpot boards | Pending | Markdown wireframe specs exist; MCP failed three times on 2026-05-18. Retry later when Penpot HTTP MCP is healthy. |
| Legacy spec deletion review | Pending after docs merge | Use `docs/specs/legacy-reconciliation.md`; delete only after explicit approval. |
| Server-wide coverage gate | Deferred | Add only after more server feature libraries are developed. |
| Additional import-boundary hardening | Deferred | Tracked by the infrastructure-upgrade planning workstream. |

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
