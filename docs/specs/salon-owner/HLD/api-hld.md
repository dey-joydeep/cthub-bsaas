# Salon Owner API HLD

**Date:** 2026-05-11
**Status:** Implementation baseline

## Purpose

Define the API resource groups for the Salon Owner MVP. Exact endpoint paths, request schemas, response envelopes, and error envelopes are defined in [OpenAPI Contract](../API/openapi.yaml).

## API Conventions

- Base path examples use `/partner/**` because MVP screens are Partner app operational workflows.
- All endpoints require authentication unless explicitly public.
- All write endpoints enforce CSRF where browser CSRF policy applies.
- All responses use the platform response envelope where existing API convention requires it.
- Error codes must use shared message keys.
- All timestamps are ISO-8601 UTC strings.
- All money/decimal values at API boundaries use strings.

## Resource Groups

| Group             | Base path                                  | Responsibility                                                                 |
| ----------------- | ------------------------------------------ | ------------------------------------------------------------------------------ |
| Business Settings | `/partner/businesses`, `/partner/branches` | Salon business, legal registration, branch profile, hours, holidays, policies. |
| Staff             | `/partner/staff`                           | Staff profile, roles, skills, shifts, leave.                                   |
| Services          | `/partner/services`                        | Categories and services.                                                       |
| Customers         | `/partner/customers`                       | Customer search/profile/notes/preferences.                                     |
| Appointments      | `/partner/appointments`                    | Bookings, walk-ins, status transitions.                                        |
| POS               | `/partner/pos`                             | Checkout context, invoices, payments, dues.                                    |
| Inventory         | `/partner/inventory`                       | Products, stock, movements, alerts.                                            |
| Dashboard         | `/partner/dashboard`                       | Read-only operational dashboard.                                               |

## API Style

Use command endpoints for state transitions when domain rules matter.

Examples:

- `POST /partner/appointments/{id}/confirm`
- `POST /partner/appointments/{id}/arrive`
- `POST /partner/appointments/{id}/cancel`
- `POST /partner/invoices/{id}/finalize`
- `POST /partner/invoices/{id}/payments`
- `POST /partner/inventory/products/{id}/adjust-stock`

## Idempotency

Use idempotency keys for high-risk writes:

- appointment creation;
- invoice finalization;
- payment capture;
- stock adjustment;
- branch/settings updates require idempotency when the operation can be retried by the client.

## Pagination And Filtering

List endpoints must support:

- `page` and `pageSize` or cursor pattern;
- branch filter where applicable;
- date range filters for appointments/invoices/payments/stock movements;
- search query for customers/services/products/staff.

## Authorization

Every endpoint must check:

- authenticated user;
- salon tenant access;
- branch scope when branch-bound;
- role permission for operation.

Sensitive operations:

- policy changes;
- discount/override;
- invoice finalization;
- stock adjustment;
- staff role changes;
- customer merge/delete;
- refund/void when later implemented.

## API Error Categories

| Category     | HTTP status | Examples                                  |
| ------------ | ----------- | ----------------------------------------- |
| Validation   | `422`       | invalid time, missing field, bad amount   |
| Unauthorized | `401`       | unauthenticated                           |
| Forbidden    | `403`       | wrong role/branch                         |
| Not found    | `404`       | entity outside scope or missing           |
| Conflict     | `409`       | slot conflict, duplicate service/customer |
| Gone         | `410`       | expired invite/session where applicable   |
| Rate limited | `429`       | abuse controls                            |

## Events And Async Work

MVP APIs can complete operations synchronously, but the service layer must publish or persist events for:

- appointment booked/status changed;
- invoice finalized;
- payment captured;
- stock movement recorded;
- settings changed.

Notification/event processing can be no-op or basic in MVP, but event boundaries must exist.
