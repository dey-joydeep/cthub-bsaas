# Dashboard FRD

**Date:** 2026-05-12
**Status:** Implementation baseline

## Purpose

Define owner/manager dashboard requirements for operational read models.

## Scope

| Capability          | Requirement                                                        |
| ------------------- | ------------------------------------------------------------------ |
| Appointment summary | Show counts by status for selected business date and branch scope. |
| Walk-in summary     | Show queue/status summary.                                         |
| Revenue snapshot    | Show finalized invoice/payment metrics according to permission.    |
| Pending dues        | Show unpaid invoice totals/counts.                                 |
| Inventory alerts    | Show low-stock count and drill-down entry points.                  |

## Actors

- Owner
- Branch Manager
- Accountant, financial read
- Operational roles with limited widgets

## Business Rules

- Dashboard respects caller business and branch access.
- Financial metrics use finalized invoices and captured payments.
- Appointment metrics use branch-local business day.
- Pending dues include invoices with due amount greater than zero.
- Low-stock count uses active products and current branch stock.

## Implementation References

- HLD: [Dashboard HLD](../HLD/dashboard.md)
- LLD: [Dashboard LLD](../LLD/dashboard.md)
- Web: [Dashboard Web](../WEB/dashboard.md)
- Validation: [Dashboard Validation](../VALIDATION/dashboard-validation.md)
