# POS Web LLD

## Route And Screen

- Route: `/owner/pos`
- Primary screens: sale draft, appointment checkout, product/service line selection, discount, payment, invoice.
- Wireframes: [POS Checkout Wireframes](../WIREFRAMES/pos-checkout.md).

## User Goals

- Reception builds and finalizes bills accurately.
- Cashier records one or more payments.
- Owner reviews invoice and refund state.

## Components

- `PosCheckoutPage`
- `SaleLineEditor`
- `DiscountPanel`
- `PaymentPanel`
- `InvoicePreview`
- `RefundDialog`

## State And Data

- Sale draft stores line items, customer, appointment reference, discounts, and payments.
- Server recalculates totals after each pricing-affecting action.
- Finalization response replaces local draft totals with authoritative invoice totals.

## Controls And Validation

- Exact control behavior is defined in [POS Validation](../VALIDATION/pos-validation.md).
- Payment controls accept method-specific fields.
- Discount controls enforce permission and policy limits.

## Error Handling

- Total mismatch refreshes server totals and keeps the draft open.
- Stock conflict highlights affected product line.
- Payment errors attach to payment method row.

## Accessibility

- Totals summary exposes subtotal, discount, tax, paid, due, and change as named values.
- Payment method rows are keyboard removable and reorder-free.
