# POS FRD

**Date:** 2026-05-12
**Status:** Implementation baseline

## Purpose

Define checkout, invoice, payment, and pending due requirements.

## Scope

| Capability           | Requirement                                                          |
| -------------------- | -------------------------------------------------------------------- |
| Checkout context     | Build checkout data from appointment/customer/service/product state. |
| Invoice draft        | Create editable draft invoice before finalization.                   |
| Invoice finalization | Server-calculated immutable totals and snapshots.                    |
| Payment capture      | Record payment modes and update due state.                           |
| Pending dues         | Track invoices with outstanding amounts.                             |

## Actors

- Owner
- Branch Manager
- Front Desk, delegated/basic checkout
- Cashier
- Accountant, read-only

## Business Rules

- Invoice belongs to one salon business, one branch, and one customer.
- Invoice totals are calculated server-side.
- Finalized invoice lines and totals are immutable.
- Payment capture must not exceed outstanding due unless policy permits and actor has permission.
- Partial payment creates or retains pending due.
- GST/tax fields are snapshotted when invoice is finalized.

## Implementation References

- HLD: [POS HLD](../HLD/pos.md)
- LLD: [POS LLD](../LLD/pos.md)
- Web: [POS Web](../WEB/pos.md)
- Validation: [POS Validation](../VALIDATION/pos-validation.md)
