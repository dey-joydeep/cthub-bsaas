# Inventory Web LLD

## Route And Screen

- Route: `/business/inventory`
- Primary screens: product catalog, stock by branch, purchase intake, adjustment, transfer, low-stock alerts.
- Wireframes: [Inventory Wireframes](../WIREFRAMES/inventory.md).

## User Goals

- Owner manages product definitions and suppliers.
- Manager receives stock into a branch.
- Authorized staff adjusts or transfers stock with reason.

## Components

- `InventoryDashboardPage`
- `ProductForm`
- `StockBalanceTable`
- `ReceiveStockForm`
- `AdjustStockDialog`
- `TransferStockDialog`
- `LowStockAlertList`

## State And Data

- Stock balance filters by branch, product category, low-stock state, and search.
- Ledger view is read-only and paginated.
- Receive, adjust, and transfer forms invalidate balance queries after success.

## Controls And Validation

- Exact control behavior is defined in [Inventory Validation](../VALIDATION/inventory-validation.md).
- Quantity controls use integer or decimal step based on product unit type.
- Adjustment reason is mandatory and rendered as an auditable field.

## Error Handling

- Insufficient stock conflict highlights source branch and product.
- Duplicate SKU attaches to SKU.
- Supplier scope errors reload supplier options.

## Accessibility

- Stock tables expose branch, product, unit, quantity, threshold, and status headers.
- Low-stock alerts include current quantity and reorder threshold.
