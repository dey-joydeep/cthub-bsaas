# Dashboard LLD

## Backend Components

Visual flow reference:

- [Dashboard Read Model Draw.io](../../../diagrams/salon-owner/drawio/dashboard-read-model-flow.drawio)

- `DashboardController`
- `DashboardQueryService`
- `DashboardReadModelRepositoryPort`
- `DashboardAggregationPort`

## Queries

- `GetOwnerOverviewQuery`
- `GetBranchPerformanceQuery`
- `GetStaffPerformanceQuery`
- `GetAppointmentSummaryQuery`
- `GetRevenueSummaryQuery`
- `GetInventoryAlertsQuery`

## Query Rules

- Every query includes business scope.
- Optional filters include branch IDs, staff IDs, date range, comparison period, and metric granularity.
- Branch manager queries are limited to assigned branches.

## Validation Mapping

- DTO validation maps to [Dashboard Validation](../VALIDATION/dashboard-validation.md).
- Service validation verifies date range bounds, filter scope, metric availability, and role-based field access.

## Error Mapping

- `DASHBOARD_FILTER_INVALID` returns `400`.
- `DASHBOARD_SCOPE_FORBIDDEN` returns `403`.
- `DASHBOARD_METRIC_UNAVAILABLE` returns `404`.

## Implementation Notes

- Dashboard queries do not mutate source records.
- Aggregations use decimal-safe calculations for financial metrics.
- Materialized read models can be refreshed by domain events when query latency requires it.
