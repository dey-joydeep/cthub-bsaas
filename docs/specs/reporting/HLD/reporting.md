# Reporting And Analytics HLD

**Date:** 2026-05-18
**Status:** Current planning baseline

## Boundary

Reporting owns read models, metric definitions, filters, exports, and scheduled delivery. Source domains own transactional truth.

## Read Model Strategy

| Source                | Reporting use                                          |
| --------------------- | ------------------------------------------------------ |
| Appointments          | Volume, status, no-show, cancellation, utilization.    |
| POS/Invoices/Payments | Revenue, tax, discounts, refunds, dues, payment modes. |
| Staff                 | Utilization, commission, service mix.                  |
| Customers             | Retention, inactive, high-value, package expiry.       |
| Inventory             | Movement, low stock, transfer, wastage.                |
| Platform              | Tenant, usage, error, subscription signals.            |

## Diagram

See [reporting-read-model-flow.drawio](../DIAGRAMS/reporting-read-model-flow.drawio).
