# POS Test Spec

## Backend Unit Tests

- Sale total calculation covers services, products, discounts, taxes, payments, and refunds.
- Discount policy enforces permission threshold.
- Invoice numbering allocation is deterministic and atomic.

## Backend Integration Tests

- Appointment checkout creates finalized sale and invoice.
- Product sale decrements stock ledger.
- Payment total mismatch returns conflict.
- Refund creates immutable reversal records.

## Web Tests

- Draft totals refresh after pricing-affecting changes.
- Payment method errors attach to payment row.
- Stock conflict highlights affected product line.

## Contract Tests

- Invoice DTO includes immutable business, branch, tax, and line snapshots.
- Money fields use decimal strings.
