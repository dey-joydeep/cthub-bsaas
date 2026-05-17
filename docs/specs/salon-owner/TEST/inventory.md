# Inventory Test Spec

## Backend Unit Tests

- Product validation covers SKU, name, unit, category, threshold, tax, and status.
- Stock ledger rejects invalid quantity and missing adjustment reason.
- Transfer produces paired debit and credit entries.

## Backend Integration Tests

- Receive stock updates branch balance and ledger.
- Adjustment requires reason and audit entry.
- Product sale consumes stock through POS.
- Insufficient stock returns conflict.

## Web Tests

- Stock table filters by branch, product, category, and low-stock state.
- Receive, adjust, and transfer forms refresh balances after success.
- Low-stock alert displays threshold and current quantity.

## Contract Tests

- Stock ledger response is append-only and paginated.
- Quantity unit examples match product unit type.
