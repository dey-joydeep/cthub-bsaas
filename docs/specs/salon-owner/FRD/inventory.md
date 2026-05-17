# Inventory FRD

**Date:** 2026-05-12
**Status:** Implementation baseline

## Purpose

Define product, branch stock, stock movement, adjustment, and low-stock alert requirements.

## Scope

| Capability       | Requirement                                 |
| ---------------- | ------------------------------------------- |
| Product catalog  | Manage retail product master data.          |
| Branch stock     | Track stock per product and branch.         |
| Stock movement   | Record ledger entries for quantity changes. |
| Stock adjustment | Correct stock with reason and audit.        |
| Low-stock alert  | Surface products at or below threshold.     |

## Actors

- Owner
- Branch Manager
- Inventory Manager
- Accountant, read-only

## Business Rules

- Product belongs to one salon business.
- Branch stock belongs to one product and one branch.
- Stock movement ledger is authoritative.
- Branch stock quantity updates in the same transaction as movement creation.
- Negative stock returns `409` unless branch policy allows it and actor has permission.
- Stock adjustment requires reason and audit.

## Implementation References

- HLD: [Inventory HLD](../HLD/inventory.md)
- LLD: [Inventory LLD](../LLD/inventory.md)
- Web: [Inventory Web](../WEB/inventory.md)
- Validation: [Inventory Validation](../VALIDATION/inventory-validation.md)
