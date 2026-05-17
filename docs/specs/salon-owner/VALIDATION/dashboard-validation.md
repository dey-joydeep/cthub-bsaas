# Dashboard Validation

**Date:** 2026-05-12
**Status:** Implementation baseline

## Owner Dashboard Filter

| Property    | Value                                                        |
| ----------- | ------------------------------------------------------------ |
| Screen ID   | `dashboard.owner`                                            |
| Form ID     | `dashboard.owner.filter`                                     |
| Actors      | Owner, Branch Manager, Accountant, limited operational roles |
| Context     | `tenantId`, `salonBusinessId`, optional `branchId`           |
| Operation   | `getOwnerDashboard`                                          |
| Idempotency | Not applicable                                               |

| Field      | Control         | Default                                            | Enabled when                       | Client validation       | Backend validation                    | Error key                               |
| ---------- | --------------- | -------------------------------------------------- | ---------------------------------- | ----------------------- | ------------------------------------- | --------------------------------------- |
| `branchId` | branch selector | all allowed for owner; assigned branch for manager | user has multiple allowed branches | optional allowed branch | branch scope and role access enforced | `error.dashboard.filter.branch.invalid` |
| `date`     | date picker     | branch-local today                                 | dashboard route active             | required ISO date       | branch-local business date            | `error.dashboard.filter.date.invalid`   |

Behavior:

- Owner can select all allowed branches when cross-branch reporting is permitted.
- Branch Manager defaults to assigned branch and cannot select unauthorized branches.
- Financial widgets are hidden or reduced for roles without financial permission.

## Dashboard Alerts Filter

| Property  | Value                                                  |
| --------- | ------------------------------------------------------ |
| Screen ID | `dashboard.alerts`                                     |
| Form ID   | `dashboard.alerts.filter`                              |
| Actors    | Owner, Branch Manager, operational roles by alert type |
| Context   | `tenantId`, `salonBusinessId`, optional `branchId`     |
| Operation | `listDashboardAlerts`                                  |

| Field      | Control         | Default                   | Enabled when                       | Client validation       | Backend validation    | Error key                               |
| ---------- | --------------- | ------------------------- | ---------------------------------- | ----------------------- | --------------------- | --------------------------------------- |
| `branchId` | branch selector | active branch/all allowed | user has multiple allowed branches | optional allowed branch | branch scope enforced | `error.dashboard.alerts.branch.invalid` |

Test mapping:

- `VAL-DASH-001`: unauthorized branch filter returns forbidden/not-found by scope policy.
- `VAL-DASH-002`: dashboard date uses branch timezone.
- `VAL-DASH-003`: financial widgets unavailable for roles without financial capability.
