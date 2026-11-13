# Dashboard Web LLD

## Route And Screen

- Route: `/business/dashboard`
- Primary screens: owner overview, branch performance, staff performance, revenue, appointment summary, inventory alerts.
- Wireframes: [Dashboard Wireframes](../WIREFRAMES/dashboard.md).

## User Goals

- Owner views business performance across branches.
- Manager monitors same-day operations for assigned branches.
- Owner identifies revenue, booking, and stock issues.

## Components

- `OwnerDashboardPage`
- `DashboardFilterBar`
- `MetricSummaryGrid`
- `RevenueTrendPanel`
- `AppointmentSummaryPanel`
- `StaffPerformanceTable`
- `InventoryAlertPanel`

## State And Data

- Filters include branch, date range, comparison period, and metric granularity.
- Dashboard panels load independently with shared filter state.
- Failed panel requests show panel-level errors without blocking other panels.

## Controls And Validation

- Exact control behavior is defined in [Dashboard Validation](../VALIDATION/dashboard-validation.md).
- Branch selector hides branches outside the actor scope.
- Date range presets map to explicit UTC ISO query bounds.

## Error Handling

- Invalid filters display inline filter bar errors.
- Scope errors hide restricted panel data and show access-denied copy inside the panel.
- Metric unavailable responses keep the panel layout stable.

## Accessibility

- Metric cards expose label, value, comparison direction, and period.
- Charts include table alternatives for the same metric data.
