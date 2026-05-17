# POS Validation

**Date:** 2026-05-12
**Status:** Implementation baseline

## Invoice Draft Form

| Property    | Value                                      |
| ----------- | ------------------------------------------ |
| Screen ID   | `pos.checkout`                             |
| Form ID     | `pos.invoice.create_draft`                 |
| Actors      | Owner, Branch Manager, Front Desk, Cashier |
| Context     | `tenantId`, `salonBusinessId`, `branchId`  |
| Operation   | `createInvoice`                            |
| Idempotency | Required                                   |

| Field           | Control                 | Default                    | Enabled when              | Client validation             | Backend validation                                              | Error key                               |
| --------------- | ----------------------- | -------------------------- | ------------------------- | ----------------------------- | --------------------------------------------------------------- | --------------------------------------- |
| `branchId`      | branch selector/context | selected branch            | branch active             | required branch               | branch active; actor can checkout                               | `error.pos.invoice.branch.invalid`      |
| `customerId`    | customer selector       | appointment customer/empty | customer lookup loaded    | required customer in business | customer belongs to business                                    | `error.pos.invoice.customer.required`   |
| `appointmentId` | readonly reference      | checkout context           | appointment checkout flow | UUID when present             | appointment belongs to branch/business and is checkout-eligible | `error.pos.invoice.appointment.invalid` |
| `lines`         | invoice line editor     | checkout context lines     | actor can create invoice  | at least one line             | at least one valid line; totals recalculated server-side        | `error.pos.invoice.lines.required`      |

Invoice line fields:

| Field         | Control       | Default              | Enabled when              | Client validation       | Backend validation                           | Error key                                    |
| ------------- | ------------- | -------------------- | ------------------------- | ----------------------- | -------------------------------------------- | -------------------------------------------- |
| `type`        | select        | from context         | line editable             | enum                    | enum                                         | `error.pos.invoice_line.type.invalid`        |
| `referenceId` | selector      | from context         | line editable             | UUID in scope           | item exists and is billable                  | `error.pos.invoice_line.reference.invalid`   |
| `description` | text input    | item name            | line editable             | required; max 160 chars | required; snapshot persisted                 | `error.pos.invoice_line.description.invalid` |
| `quantity`    | decimal input | `1`                  | line editable             | decimal > 0             | decimal > 0; product stock policy where sale | `error.pos.invoice_line.quantity.invalid`    |
| `unitPrice`   | money input   | server context price | price override capability | money >= 0              | money >= 0; override permission if changed   | `error.pos.invoice_line.unit_price.invalid`  |

## Finalize Invoice Form

| Property    | Value                                                  |
| ----------- | ------------------------------------------------------ |
| Screen ID   | `pos.invoice.finalize`                                 |
| Form ID     | `pos.invoice.finalize`                                 |
| Actors      | Owner, Branch Manager, Cashier, delegated Front Desk   |
| Context     | `tenantId`, `salonBusinessId`, `branchId`, `invoiceId` |
| Operation   | `finalizeInvoice`                                      |
| Idempotency | Required                                               |

| Field            | Control                     | Default      | Enabled when           | Client validation             | Backend validation               | Error key                                    |
| ---------------- | --------------------------- | ------------ | ---------------------- | ----------------------------- | -------------------------------- | -------------------------------------------- |
| `confirmedTotal` | readonly money confirmation | server total | invoice status `DRAFT` | equals displayed server total | server recalculates and compares | `error.pos.finalize.confirmed_total.invalid` |

Conflict behavior:

- Stale total returns `409` with `error.pos.finalize.total_changed`; UI reloads invoice.

## Payment Capture Form

| Property    | Value                                                  |
| ----------- | ------------------------------------------------------ |
| Screen ID   | `pos.payment.capture`                                  |
| Form ID     | `pos.payment.capture`                                  |
| Actors      | Owner, Branch Manager, Cashier, delegated Front Desk   |
| Context     | `tenantId`, `salonBusinessId`, `branchId`, `invoiceId` |
| Operation   | `captureInvoicePayment`                                |
| Idempotency | Required                                               |

| Field        | Control          | Default           | Enabled when                      | Client validation           | Backend validation                                  | Error key                               |
| ------------ | ---------------- | ----------------- | --------------------------------- | --------------------------- | --------------------------------------------------- | --------------------------------------- |
| `amount`     | money input      | due amount        | invoice finalized and due > 0     | money > 0; <= displayed due | money > 0; cannot exceed due unless policy permits  | `error.pos.payment.amount.invalid`      |
| `method`     | select           | last used/default | payment capture allowed           | enum                        | allowed payment mode for branch                     | `error.pos.payment.method.invalid`      |
| `receivedAt` | date-time picker | now               | payment capture allowed           | UTC ISO                     | not before invoice creation; policy-valid           | `error.pos.payment.received_at.invalid` |
| `reference`  | text input       | empty             | method requires/accepts reference | max 120 chars               | required for configured modes where policy requires | `error.pos.payment.reference.invalid`   |

Test mapping:

- `VAL-POS-001`: invoice draft without lines fails.
- `VAL-POS-002`: finalize stale total returns conflict.
- `VAL-POS-003`: payment above due returns validation/conflict by policy.
