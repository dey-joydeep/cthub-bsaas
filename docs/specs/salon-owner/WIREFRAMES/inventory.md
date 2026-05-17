# Inventory Wireframes

## Purpose

Define the visual baseline for product catalog, branch stock, purchase intake, adjustment, transfer, and low-stock alerts.

## Source Documents

- [Inventory FRD](../FRD/inventory.md)
- [Inventory HLD](../HLD/inventory.md)
- [Inventory LLD](../LLD/inventory.md)
- [Inventory Web LLD](../WEB/inventory.md)
- [Inventory Validation](../VALIDATION/inventory-validation.md)
- [Inventory Tests](../TEST/inventory.md)
- [API Endpoint Map](../API/endpoint-map.md#inventory)
- [Inventory Stock Ledger Draw.io](../../../diagrams/salon-owner/drawio/inventory-stock-ledger-flow.drawio)

## Target Penpot Boards

| Screen state     | Board name                           | Purpose                                      |
| ---------------- | ------------------------------------ | -------------------------------------------- |
| Stock list       | `inventory.stock-list.desktop`       | Product and branch stock table with filters. |
| Movement dialogs | `inventory.movement-dialogs.desktop` | Receive, adjust, and transfer stock.         |
| Low-stock alerts | `inventory.low-stock.desktop`        | Alert list and reorder action entry points.  |

## Verified Penpot Board IDs

- `inventory.stock-list.desktop`: `a7a9ed20-bb04-8098-8008-08d76e0ec16f`
- `inventory.movement-dialogs.desktop`: `a7a9ed20-bb04-8098-8008-08d783d418c8`
- `inventory.low-stock.desktop`: `a7a9ed20-bb04-8098-8008-08d7a64b54a6`

## Screen Transitions

| From state        | User action    | Target state                         | Backend interaction   |
| ----------------- | -------------- | ------------------------------------ | --------------------- |
| Stock list        | Receive stock  | Receive dialog                       | no write until submit |
| Receive dialog    | Save           | Stock list refreshed                 | `createStockMovement` |
| Stock list        | Adjust stock   | Adjustment dialog                    | no write until submit |
| Adjustment dialog | Save           | Stock list or conflict               | `adjustProductStock`  |
| Stock list        | Transfer stock | Transfer dialog                      | no write until submit |
| Transfer dialog   | Save           | Source and target balances refreshed | `createStockMovement` |

## Required States

- empty product list;
- low-stock filtered view;
- insufficient stock conflict;
- adjustment reason missing;
- successful stock ledger update;
- server error with correlation ID.
