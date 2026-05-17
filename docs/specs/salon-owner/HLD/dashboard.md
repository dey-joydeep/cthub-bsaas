# Dashboard HLD

## Purpose

Dashboard provides operational and business insights for owners and managers across branches, staff, appointments, revenue, inventory, and customers.

## Architecture Scope

- Owns read models and query composition for reporting views.
- Does not own transactional source records.
- Presents near-real-time summaries for daily operation and historical summaries for decision-making.

## Dependencies

- Appointment supplies bookings, utilization, cancellation, and no-show data.
- POS supplies revenue, payment, discount, and refund data.
- Customer CRM supplies customer growth and retention data.
- Inventory supplies low-stock and stock movement data.
- Staff supplies roster and productivity dimensions.

## Data Ownership

- Dashboard read models can be materialized for performance.
- Source-of-truth data remains in feature-owned transactional tables.
- Report filters always include business scope and can include branch, staff, date range, and channel.

## Integration Points

- API operations are listed in [API endpoint map](../API/endpoint-map.md#dashboard).
- Detailed query contracts are defined in [Dashboard LLD](../LLD/dashboard.md).
- Screen behavior is defined in [Dashboard Web LLD](../WEB/dashboard.md).
- Validation rules are defined in [Dashboard Validation](../VALIDATION/dashboard-validation.md).

## Events

Dashboard consumes feature events for read model refresh where materialized views are used. It does not emit business events for normal query access.

## Security And Consistency

- Dashboard data is filtered by business and permission scope on every query.
- Branch managers see only assigned branches.
- Financial metrics use server-side aggregation and fixed decimal handling.
