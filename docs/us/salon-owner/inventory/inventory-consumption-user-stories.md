# Inventory And Consumption User Stories

**Date:** 2026-05-11
**Status:** Product-owner draft

## Owner Outcome

As a salon owner, I want to track retail stock and professional-use product consumption so that stock-outs, wastage, and hidden costs are reduced.

## Actors

- Salon Owner
- Branch Manager
- Inventory Staff
- Service Staff
- Cashier

## Primary Screens

- Inventory dashboard
- Product catalog
- Stock adjustment
- Stock transfer
- Consumption capture
- Low-stock report

## User Stories

### INV-US-001: Retail product stock

As an inventory manager, I want to track retail products by branch, quantity, cost, selling price, expiry, and reorder threshold so that products can be sold reliably.

### INV-US-002: Professional-use consumption

As a salon owner, I want professional products used during services to be recorded so that service profitability and wastage are visible.

### INV-US-003: Low-stock and reorder

As a branch manager, I want low-stock alerts and reorder suggestions so that staff can restock before service quality is affected.

### INV-US-004: Branch transfer and adjustment

As a multi-branch owner, I want to transfer stock between branches and record wastage/damage adjustments so that inventory remains accurate.

## Functional Requirements

- Manage products with category, SKU/barcode optional, unit, purchase cost, selling price, tax, vendor, expiry optional.
- Track stock by branch.
- Support stock in, sale, service consumption, transfer, adjustment, damage, expiry, and return.
- Link retail product sale to invoice.
- Link professional-use consumption to completed service or manual adjustment.
- Configure reorder threshold per branch/product.
- Support stock count and variance adjustment.

## Business Rules And Edge Cases

- Retail sale should reduce stock when invoice finalizes.
- Service consumption should reduce stock when service completion or checkout is confirmed, depending on configured policy.
- Stock cannot go negative unless branch policy allows manager override.
- Transfers must decrement source and increment destination with traceability.
- Expired/damaged stock must not be available for sale.
- Historical stock movement must remain immutable after closing period.

## Acceptance Criteria

- Given stock falls below threshold, when dashboard loads, then the branch low-stock alert is visible.
- Given a retail product is added to checkout, when invoice finalizes, then branch stock decreases.
- Given a service has configured product consumption, when checkout completes, then professional-use stock movement is created.
- Given stock is transferred between branches, when transfer is accepted, then both branch quantities update with a linked movement record.

## Non-Functional Requirements

- Stock movements must be auditable and traceable.
- Inventory reports must reconcile with product sales and service consumption.
- Barcode scanning should be optional, not required for MVP.
- Inventory screens should support mobile/tablet stock count flows later.

## HLD/LLD Hints

- Use stock movement ledger rather than only mutable quantity fields.
- Separate product master data from branch stock state.
- Define closing-period rules before accounting integration.
