# Dashboard Test Spec

## Backend Unit Tests

- Query validation covers business scope, branch filters, staff filters, date range, and granularity.
- Financial aggregations use decimal-safe calculations.
- Role filter restricts branch manager data.

## Backend Integration Tests

- Owner overview aggregates across branches.
- Branch manager overview returns assigned branches only.
- Revenue summary includes refunds and discounts.
- Inventory alerts reflect low-stock threshold.

## Web Tests

- Dashboard panels load independently.
- Failed panel does not block other panel data.
- Chart panels expose table alternatives.

## Contract Tests

- Metric response schemas include period, value, comparison, and filters.
- Unauthorized branch filter returns scope error.
