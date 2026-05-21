# Project-Wide Documentation Readiness Review

**Date:** 2026-05-18
**Status:** Merged baseline

## Purpose

Record the final readiness state for project-wide documentation before broad implementation starts. This review is based on the stacked documentation PRs opened on 2026-05-18 and later merged into `main`.

## PR Stack

| Order | PR                                                        | Branch                                     | Base                                       | Scope                                        |
| ----- | --------------------------------------------------------- | ------------------------------------------ | ------------------------------------------ | -------------------------------------------- |
| 1     | [#29](https://github.com/dey-joydeep/cthub-bsaas/pull/29) | `docs/project-wide-cross-cutting-specs`    | `main`                                     | Shared cross-cutting specs.                  |
| 2     | [#30](https://github.com/dey-joydeep/cthub-bsaas/pull/30) | `docs/account-profile-app-shell-specs`     | `docs/project-wide-cross-cutting-specs`    | Account/Profile and App Shell.               |
| 3     | [#31](https://github.com/dey-joydeep/cthub-bsaas/pull/31) | `docs/customer-app-public-discovery-specs` | `docs/account-profile-app-shell-specs`     | Customer App and Public Discovery.           |
| 4     | [#32](https://github.com/dey-joydeep/cthub-bsaas/pull/32) | `docs/platform-admin-specs`                | `docs/customer-app-public-discovery-specs` | Platform Admin.                              |
| 5     | [#33](https://github.com/dey-joydeep/cthub-bsaas/pull/33) | `docs/notifications-integrations-specs`    | `docs/platform-admin-specs`                | Notifications and Integrations.              |
| 6     | [#34](https://github.com/dey-joydeep/cthub-bsaas/pull/34) | `docs/reporting-reputation-specs`          | `docs/notifications-integrations-specs`    | Reporting and Reputation.                    |
| 7     | [#35](https://github.com/dey-joydeep/cthub-bsaas/pull/35) | `docs/data-privacy-governance-specs`       | `docs/reporting-reputation-specs`          | Data Privacy and Governance.                 |
| 8     | [#36](https://github.com/dey-joydeep/cthub-bsaas/pull/36) | `docs/legacy-spec-reconciliation`          | `docs/data-privacy-governance-specs`       | Legacy spec reconciliation matrix.           |
| 9     | [#37](https://github.com/dey-joydeep/cthub-bsaas/pull/37) | `docs/project-wide-doc-readiness-review`   | `docs/legacy-spec-reconciliation`          | Project-wide documentation readiness review. |

## Readiness Matrix

| Area                  | US  | FRD/FNRD | HLD | LLD | API map | Web | Validation | Test | Diagram | Wireframe notes | Status                  |
| --------------------- | --- | -------- | --- | --- | ------- | --- | ---------- | ---- | ------- | --------------- | ----------------------- |
| Cross-cutting system  | N/A | Yes      | Yes | Yes | Yes     | N/A | N/A        | Yes  | Yes     | N/A             | Ready after #29 merges. |
| Account/Profile       | Yes | Yes      | Yes | Yes | Yes     | Yes | Yes        | Yes  | Yes     | Yes             | Ready after #30 merges. |
| App Shell             | Yes | Yes      | Yes | Yes | Yes     | Yes | Yes        | Yes  | Yes     | Yes             | Ready after #30 merges. |
| Customer App          | Yes | Yes      | Yes | Yes | Yes     | Yes | Yes        | Yes  | Yes     | Yes             | Ready after #31 merges. |
| Public Discovery      | Yes | Yes      | Yes | Yes | Yes     | Yes | Yes        | Yes  | Yes     | Yes             | Ready after #31 merges. |
| Platform Admin        | Yes | Yes      | Yes | Yes | Yes     | Yes | Yes        | Yes  | Yes     | Yes             | Ready after #32 merges. |
| Notifications         | Yes | Yes      | Yes | Yes | Yes     | Yes | Yes        | Yes  | Yes     | Yes             | Ready after #33 merges. |
| Integrations          | Yes | Yes      | Yes | Yes | Yes     | Yes | Yes        | Yes  | Yes     | Yes             | Ready after #33 merges. |
| Reporting             | Yes | Yes      | Yes | Yes | Yes     | Yes | Yes        | Yes  | Yes     | Yes             | Ready after #34 merges. |
| Reputation            | Yes | Yes      | Yes | Yes | Yes     | Yes | Yes        | Yes  | Yes     | Yes             | Ready after #34 merges. |
| Data Privacy          | Yes | Yes      | Yes | Yes | Yes     | Yes | Yes        | Yes  | Yes     | Yes             | Ready after #35 merges. |
| Legacy reconciliation | N/A | N/A      | N/A | N/A | N/A     | N/A | N/A        | N/A  | N/A     | N/A             | Ready after #36 merges. |

## Known Remaining Non-Code Work

| Item                                 | Status        | Rule                                                                                                                                                                                                                             |
| ------------------------------------ | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Live Penpot boards                   | Done          | Live Penpot boards were created for the project-wide wireframe specs after Penpot MCP token regeneration. Board IDs are recorded in the feature wireframe documents across PRs #30 through #35.                                  |
| Deleting legacy docs                 | Done          | Legacy spec folders were reconciled into current production-level docs where useful and removed when obsolete or future-scope-only.                                                                                              |
| OpenAPI full contracts for new areas | Done          | `docs/specs/project-wide/API/openapi.yaml` defines the target contract for supporting areas not covered by Auth or Salon Owner MVP OpenAPI files; `docs/specs/project-wide/API/schema-catalog.md` defines operation DTO content. |
| Implementation slicing               | Done          | `docs/specs/project-wide/IMPLEMENTATION/implementation-slicing.md` defines branch strategy, sequencing, project boundaries, and validation gates.                                                                                |
| Main-branch status update            | Pending merge | `docs/status/task-tracking.md` is updated in this stacked branch. It becomes authoritative after the PR stack is merged.                                                                                                         |

## Decision

The stacked PRs were merged in order. Project-wide documentation is ready to drive implementation slicing and feature coding according to the project-wide implementation plan.

Recommended next implementation branch after merge:

```text
feature/server-salon-owner-foundation
```

That branch should start from shared platform contracts and the Salon Owner foundation slice before moving into operational feature slices.
