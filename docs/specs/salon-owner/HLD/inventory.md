# Inventory HLD

## Purpose

Inventory manages products, branch stock, purchase intake, stock adjustments, low-stock alerts, and product usage from POS or service consumption.

## Architecture Scope

- Owns product catalog, stock ledger, branch stock balances, suppliers, purchase receipts, and adjustments.
- Integrates with POS for retail sales and with service workflows for consumable usage where configured.
- Supplies stock health to dashboard reporting.

## Dependencies

- Branch Settings supplies stock locations.
- POS consumes stock for product sale lines.
- Service Catalog can reference consumable products for service usage estimation.
- Business Settings supplies currency and tax defaults for purchase records.

## Data Ownership

- Product belongs to one business.
- Stock balances are branch-specific.
- Stock ledger is append-only; balance records are derived from committed ledger entries.

## Integration Points

- API operations are listed in [API endpoint map](../API/endpoint-map.md#inventory).
- Detailed commands and transactions are defined in [Inventory LLD](../LLD/inventory.md).
- Screen behavior is defined in [Inventory Web LLD](../WEB/inventory.md).
- Validation rules are defined in [Inventory Validation](../VALIDATION/inventory-validation.md).

## Events

- `ProductCreated`
- `ProductUpdated`
- `StockReceived`
- `StockAdjusted`
- `StockTransferred`
- `LowStockThresholdReached`

## Security And Consistency

- Stock cannot become negative unless an explicit branch policy enables backorder-like behavior for retail products.
- Adjustments require a reason code and audit record.
- Purchase intake and stock balance update run in one transaction.
