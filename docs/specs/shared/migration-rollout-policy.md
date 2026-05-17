# Migration And Rollout Policy

**Date:** 2026-05-18
**Status:** Current cross-cutting baseline

## Purpose

Define safe database, API, and feature rollout practices for this project.

## Database Migration Rules

| Rule ID | Rule |
| --- | --- |
| MIG-001 | Schema changes must be represented by meaningful migrations. |
| MIG-002 | Destructive migrations require explicit review and a rollback or recovery note. |
| MIG-003 | Backfills must be idempotent or clearly documented as one-time controlled operations. |
| MIG-004 | Large table changes should be phased into expand, backfill, switch, and contract steps. |
| MIG-005 | Foreign keys and uniqueness constraints must reflect business scope rules. |
| MIG-006 | Migration status must be checked before implementation branches are considered ready. |

## API Rollout Rules

- Prefer additive changes.
- Do not remove fields or routes until consumers are migrated.
- Breaking changes require versioning or a planned compatibility window.
- OpenAPI must be updated with the intended contract before code merge.
- Deprecated fields must be documented with replacement and removal timing.

## Feature Rollout Rules

Use feature flags or configuration gates when:

- a feature affects payment, booking, notification, or privacy behavior;
- data migration and UI rollout may not happen at the same time;
- a feature should be enabled per tenant/business/branch;
- provider integration readiness varies by environment.

## Deployment Safety

Before production rollout:

- migrations pass in a staging-like environment;
- rollback impact is documented;
- observability exists for the changed path;
- support/admin visibility exists for operationally risky flows;
- data export/delete/retention impacts are reviewed when PII is touched.

## Diagram

See [migration-rollout-lifecycle.drawio](DIAGRAMS/migration-rollout-lifecycle.drawio).

## Test Requirements

Implementation PRs with migrations must verify:

- migration applies cleanly;
- generated client/schema artifacts are current;
- affected integration tests pass;
- rollback or recovery notes exist for risky changes;
- existing API consumers are not broken without documented migration.
