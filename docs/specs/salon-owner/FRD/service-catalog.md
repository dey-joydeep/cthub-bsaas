# Service Catalog FRD

**Date:** 2026-05-12
**Status:** Implementation baseline

## Purpose

Define business requirements for service categories, services, branch overrides, and staff eligibility.

## Scope

| Capability           | Requirement                                                         |
| -------------------- | ------------------------------------------------------------------- |
| Categories           | Organize services within a salon business.                          |
| Service definition   | Define duration, buffer, price, tax, status, and staff eligibility. |
| Branch override      | Override price, duration, visibility, and eligibility by branch.    |
| History preservation | Transaction records preserve service snapshots.                     |

## Actors

- Owner
- Branch Manager
- Front Desk, read access
- Service Staff, read access
- Cashier, read access

## Business Rules

- Service category and service definitions belong to one salon business.
- Service duration must be greater than zero.
- Base price must be zero or greater.
- Inactive services must not be selectable for new bookings or invoice lines.
- Branch service overrides apply to one branch only.
- Staff eligibility must be enforced during slot search and booking commit.

## Implementation References

- HLD: [Service Catalog HLD](../HLD/service-catalog.md)
- LLD: [Service Catalog LLD](../LLD/service-catalog.md)
- Web: [Service Catalog Web](../WEB/service-catalog.md)
- Validation: [Service Catalog Validation](../VALIDATION/service-catalog-validation.md)
