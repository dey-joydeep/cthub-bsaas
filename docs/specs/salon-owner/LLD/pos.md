# POS LLD

## Backend Components

Visual flow reference:

- [POS Finalization Draw.io](../../../diagrams/salon-owner/drawio/pos-finalization-flow.drawio)

- `PosController`
- `PosService`
- `SaleRepositoryPort`
- `InvoiceNumberPort`
- `PaymentPort`
- `StockLedgerPort`
- `TaxCalculationService`

## Commands And Queries

- `CreateSaleDraftCommand`
- `AddSaleLineCommand`
- `ApplyDiscountCommand`
- `RemoveSaleLineCommand`
- `FinalizeSaleCommand`
- `RecordPaymentCommand`
- `IssueRefundCommand`
- `GetInvoiceQuery`

## Transaction Rules

- Sale finalization creates invoice, payment records, appointment billing update, and stock ledger entries in one transaction.
- Invoice number allocation is atomic.
- Refunds create immutable reversal records and never mutate settled payment records.

## Validation Mapping

- DTO validation maps to [POS Validation](../VALIDATION/pos-validation.md).
- Service validation verifies line availability, discount permission, tax recomputation, payment total, stock availability, and refund bounds.

## Error Mapping

- `SALE_NOT_FOUND` returns `404`.
- `SALE_ALREADY_FINALIZED` returns `409`.
- `SALE_TOTAL_MISMATCH` returns `409`.
- `PAYMENT_TOTAL_INVALID` returns `400`.
- `POS_VALIDATION_FAILED` returns `400`.

## Implementation Notes

- Client-submitted totals are treated as display hints; server totals are authoritative.
- Money DTOs use decimal strings.
- Invoice output includes immutable legal and tax snapshots.
