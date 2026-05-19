# Dashboard Wireframes

## Purpose

Define the visual baseline for owner overview, branch manager dashboard, metric panels, alerts, and reporting filters.

## Source Documents

- [Dashboard FRD](../FRD/dashboard.md)
- [Dashboard HLD](../HLD/dashboard.md)
- [Dashboard LLD](../LLD/dashboard.md)
- [Dashboard Web LLD](../WEB/dashboard.md)
- [Dashboard Validation](../VALIDATION/dashboard-validation.md)
- [Dashboard Tests](../TEST/dashboard.md)
- [API Endpoint Map](../API/endpoint-map.md#dashboard)
- [Dashboard Read Model Draw.io](../DIAGRAMS/drawio/dashboard-read-model-flow.drawio)

## Target Penpot Boards

| Screen state            | Board name                         | Purpose                                            |
| ----------------------- | ---------------------------------- | -------------------------------------------------- |
| Owner overview          | `dashboard.owner.desktop`          | Cross-branch owner metrics and alerts.             |
| Branch manager overview | `dashboard.branch-manager.desktop` | Assigned-branch operations dashboard.              |
| Panel error state       | `dashboard.panel-error.desktop`    | One failed metric panel without blocking the page. |

## Verified Penpot Board IDs

- `dashboard.owner.desktop`: `a7a9ed20-bb04-8098-8008-08d97b1bcb23`
- `dashboard.branch-manager.desktop`: `a7a9ed20-bb04-8098-8008-08d9e9021bf6`
- `dashboard.panel-error.desktop`: `a7a9ed20-bb04-8098-8008-08da15887883`

## Required States

- owner all-branch view;
- branch manager scoped view;
- empty metric period;
- restricted branch filter;
- panel-level error;
- low-stock and appointment alerts.
