# Inventory Validation

**Date:** 2026-05-12
**Status:** Implementation baseline

## Product Form

| Property    | Value                                               |
| ----------- | --------------------------------------------------- |
| Screen ID   | `inventory.products`                                |
| Form ID     | `inventory.product.upsert`                          |
| Actors      | Owner, Branch Manager, Inventory Manager            |
| Context     | `tenantId`, `salonBusinessId`; `productId` for edit |
| Operations  | `createProduct`, `updateProduct`                    |
| Idempotency | Required for create                                 |

| Field          | Control       | Default          | Enabled when                       | Client validation         | Backend validation                                 | Error key                                       |
| -------------- | ------------- | ---------------- | ---------------------------------- | ------------------------- | -------------------------------------------------- | ----------------------------------------------- |
| `name`         | text input    | empty/current    | actor can manage product           | required; 2-120 chars     | required; trimmed                                  | `error.inventory.product.name.invalid`          |
| `sku`          | text input    | empty/current    | actor can manage product           | required; 2-80 chars      | required; unique per business where configured     | `error.inventory.product.sku.invalid`           |
| `unit`         | select        | `PIECE`/current  | create; edit before stock movement | enum                      | enum; locked after stock movement unless migration | `error.inventory.product.unit.invalid`          |
| `retailPrice`  | money input   | `0.00`/current   | actor can manage product           | money >= 0                | money >= 0                                         | `error.inventory.product.retail_price.invalid`  |
| `reorderPoint` | decimal input | empty/current    | actor can manage product           | decimal >= 0 when present | decimal >= 0                                       | `error.inventory.product.reorder_point.invalid` |
| `status`       | select        | `ACTIVE`/current | actor can manage product           | enum                      | inactive blocks new sale lines                     | `error.inventory.product.status.invalid`        |

## Stock Movement Form

| Property    | Value                                     |
| ----------- | ----------------------------------------- |
| Screen ID   | `inventory.stock_movement`                |
| Form ID     | `inventory.stock_movement.create`         |
| Actors      | Owner, Branch Manager, Inventory Manager  |
| Context     | `tenantId`, `salonBusinessId`, `branchId` |
| Operation   | `createStockMovement`                     |
| Idempotency | Required                                  |

| Field       | Control                 | Default         | Enabled when     | Client validation            | Backend validation                                    | Error key                                   |
| ----------- | ----------------------- | --------------- | ---------------- | ---------------------------- | ----------------------------------------------------- | ------------------------------------------- |
| `branchId`  | branch selector/context | selected branch | branch active    | required allowed branch      | branch belongs to business and actor can manage stock | `error.inventory.movement.branch.invalid`   |
| `productId` | product selector        | empty           | branch selected  | required product in business | active product belongs to business                    | `error.inventory.movement.product.invalid`  |
| `quantity`  | decimal input           | empty           | product selected | decimal; non-zero            | decimal; non-zero; scale 3                            | `error.inventory.movement.quantity.invalid` |
| `reason`    | select                  | `ADJUSTMENT`    | product selected | enum                         | enum; reason required for audit                       | `error.inventory.movement.reason.invalid`   |
| `note`      | textarea                | empty           | product selected | max 240 chars                | max 240 chars                                         | `error.inventory.movement.note.invalid`     |

Conflict behavior:

- Negative resulting stock returns `409` with `error.inventory.stock.negative_not_allowed` unless policy and permission allow it.

## Stock Adjustment Form

| Property    | Value                                                  |
| ----------- | ------------------------------------------------------ |
| Screen ID   | `inventory.stock_adjustment`                           |
| Form ID     | `inventory.stock_adjustment.create`                    |
| Actors      | Owner, Branch Manager, Inventory Manager               |
| Context     | `tenantId`, `salonBusinessId`, `branchId`, `productId` |
| Operation   | `adjustProductStock`                                   |
| Idempotency | Required                                               |

Uses Stock Movement fields. `reason` defaults to `ADJUSTMENT` and must remain audit-visible.

## Low-Stock Filter Form

| Property  | Value                                              |
| --------- | -------------------------------------------------- |
| Screen ID | `inventory.low_stock`                              |
| Form ID   | `inventory.low_stock.filter`                       |
| Actors    | Owner, Branch Manager, Inventory Manager           |
| Context   | `tenantId`, `salonBusinessId`, optional `branchId` |
| Operation | `listLowStockAlerts`                               |

| Field      | Control         | Default                     | Enabled when            | Client validation | Backend validation     | Error key                                  |
| ---------- | --------------- | --------------------------- | ----------------------- | ----------------- | ---------------------- | ------------------------------------------ |
| `branchId` | branch selector | selected branch/all allowed | actor has branch access | allowed branch    | branch access enforced | `error.inventory.low_stock.branch.invalid` |

Test mapping:

- `VAL-INV-001`: product SKU duplicate returns conflict.
- `VAL-INV-002`: zero stock movement quantity fails.
- `VAL-INV-003`: negative stock returns conflict when policy disallows it.
