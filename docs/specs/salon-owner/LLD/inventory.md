# Inventory LLD

## Backend Components

Visual flow reference:

- [Inventory Stock Ledger Draw.io](../DIAGRAMS/drawio/inventory-stock-ledger-flow.drawio)

- `InventoryController`
- `InventoryService`
- `ProductRepositoryPort`
- `StockLedgerRepositoryPort`
- `SupplierRepositoryPort`
- `LowStockNotificationPort`

## Commands And Queries

- `ListProductsQuery`
- `CreateProductCommand`
- `UpdateProductCommand`
- `ReceiveStockCommand`
- `AdjustStockCommand`
- `TransferStockCommand`
- `ListStockLedgerQuery`
- `ListLowStockQuery`

## Transaction Rules

- Stock changes append ledger rows and update branch balance in one transaction.
- Purchase receipt creates supplier reference, purchase record, stock ledger entries, and audit entry together.
- Transfer creates paired debit and credit ledger entries.

## Validation Mapping

- DTO validation maps to [Inventory Validation](../VALIDATION/inventory-validation.md).
- Service validation verifies SKU uniqueness, branch scope, positive quantities, adjustment reason, supplier scope, and negative-stock policy.

## Error Mapping

- `PRODUCT_NOT_FOUND` returns `404`.
- `PRODUCT_SKU_DUPLICATE` returns `409`.
- `STOCK_INSUFFICIENT` returns `409`.
- `STOCK_ADJUSTMENT_REASON_REQUIRED` returns `400`.
- `INVENTORY_VALIDATION_FAILED` returns `400`.

## Implementation Notes

- Stock ledger is append-only.
- Product archive blocks new sales and purchase intake but preserves historical ledger.
- Low-stock state is derived from branch balance and threshold.
