# POS Checkout Wireframes

## Purpose

Define the visual baseline for sale draft, payment, invoice, refund, and conflict handling.

## Source Documents

- [POS FRD](../FRD/pos.md)
- [POS HLD](../HLD/pos.md)
- [POS LLD](../LLD/pos.md)
- [POS Web LLD](../WEB/pos.md)
- [POS Validation](../VALIDATION/pos-validation.md)
- [POS Tests](../TEST/pos.md)
- [API Endpoint Map](../API/endpoint-map.md#pos)
- [POS Finalization Draw.io](../../../diagrams/salon-owner/drawio/pos-finalization-flow.drawio)

## Target Penpot Boards

| Screen state      | Board name                   | Purpose                                                     |
| ----------------- | ---------------------------- | ----------------------------------------------------------- |
| Sale draft        | `pos.checkout-draft.desktop` | Build bill from appointment, services, products, discounts. |
| Payment           | `pos.payment.desktop`        | Record payment methods, amount, references, and due state.  |
| Finalized invoice | `pos.invoice.desktop`        | Show immutable invoice snapshot and refund entry point.     |
| Conflict state    | `pos.conflict.desktop`       | Total mismatch, stock conflict, or discount denial.         |

## Verified Penpot Board IDs

- `pos.checkout-draft.desktop`: `a7a9ed20-bb04-8098-8008-08d6900fd119`
- `pos.payment.desktop`: `a7a9ed20-bb04-8098-8008-08d6e31f8e42`
- `pos.invoice.desktop`: `a7a9ed20-bb04-8098-8008-08d70141a52e`
- `pos.conflict.desktop`: `a7a9ed20-bb04-8098-8008-08db49d9356a`

## Screen Transitions

| From state        | User action         | Target state                        | Backend interaction                       |
| ----------------- | ------------------- | ----------------------------------- | ----------------------------------------- |
| Sale draft        | Add service/product | Sale draft with recalculated totals | `createInvoice` or draft update operation |
| Sale draft        | Apply discount      | Sale draft or permission conflict   | server recalculates discount and tax      |
| Sale draft        | Add payment         | Payment panel                       | no write until payment submit             |
| Payment panel     | Record payment      | Updated draft or finalized invoice  | `captureInvoicePayment`                   |
| Sale draft        | Finalize            | Finalized invoice or conflict       | `finalizeInvoice`                         |
| Finalized invoice | Refund              | Refund dialog                       | refund operation when added to OpenAPI    |

## Required States

- appointment checkout context;
- walk-in checkout context;
- empty draft;
- product stock conflict;
- payment total mismatch;
- discount permission denial;
- finalized invoice;
- refund initiated;
- server error with correlation ID.
