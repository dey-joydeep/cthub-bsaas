# POS HLD

## Purpose

POS manages in-salon checkout, bill composition, discounts, taxes, payment recording, refunds, and invoice issuance.

## Architecture Scope

- Owns sale, invoice, payment, refund, discount, and tax snapshot records.
- Converts appointment services, walk-in services, and product items into bill lines.
- Supplies revenue and collection data to dashboard reporting.

## Dependencies

- Service Catalog supplies service line details.
- Inventory supplies sellable product availability and stock decrement.
- Appointment supplies billable appointment context.
- Business Settings supplies tax, currency, and invoice numbering policy.

## Data Ownership

- A sale belongs to one business and one branch.
- Invoice numbers are branch or business scoped according to policy.
- Payment records are immutable after settlement; corrections use refund or adjustment records.

## Integration Points

- API operations are listed in [API endpoint map](../API/endpoint-map.md#pos).
- Detailed commands and transactions are defined in [POS LLD](../LLD/pos.md).
- Screen behavior is defined in [POS Web LLD](../WEB/pos.md).
- Validation rules are defined in [POS Validation](../VALIDATION/pos-validation.md).

## Events

- `SaleDraftCreated`
- `SaleFinalized`
- `PaymentRecorded`
- `InvoiceIssued`
- `RefundRecorded`
- `InventoryStockConsumed`

## Security And Consistency

- Finalization is atomic across invoice, payment, appointment billing state, and stock movement.
- Discounts require permission when exceeding branch policy limits.
- Payment totals, tax totals, and invoice totals are recalculated server-side.
