# Salon Owner Business Operating Model

**Date:** 2026-05-11
**Status:** Implementation baseline

## Purpose

Define how real salon owners operate multiple businesses and branches, and how the platform must model that business reality.

## Operating Assumption

The platform must support a salon owner who can operate:

- one or more salon businesses under the same platform tenant;
- one or more legal registrations per salon business when required by tax/accounting rules;
- one or more physical branches per salon business;
- staff who work in one branch or rotate across branches;
- customers who visit any branch that belongs to the same salon business;
- services that are defined at business level and overridden at branch level;
- inventory tracked at branch level with future support for inter-branch transfer;
- owner reporting across all businesses, a selected business, or a selected branch.

The MVP can onboard a single business and branch first, but the domain model and authorization model must not block multi-business or multi-branch operation.

## Business Hierarchy

```text
Tenant
  -> SalonBusiness
      -> SalonLegalRegistration
      -> Branch
          -> BranchStaffAssignment
          -> BranchServiceOverride
          -> BranchStock
          -> Appointment
          -> Invoice
```

## Entity Responsibilities

| Entity                 | Business meaning                                      | Required behavior                                                                  |
| ---------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Tenant                 | Platform account boundary.                            | Owns users, subscriptions, and tenant-wide security context.                       |
| SalonBusiness          | A salon brand/business operated by an owner.          | Owns customer records, service catalog, staff profiles, reporting, and settings.   |
| SalonLegalRegistration | Legal/tax registration used for invoicing/compliance. | Stores GSTIN/tax identity, invoice numbering scope, and registered address.        |
| Branch                 | Physical service location.                            | Owns hours, holidays, local policies, staff assignments, bookings, POS, and stock. |
| BranchStaffAssignment  | Staff availability and access for a branch.           | Controls branch access, role, shift, and booking eligibility.                      |
| BranchServiceOverride  | Local service configuration.                          | Overrides price, duration, visibility, tax category, and eligible staff.           |
| CustomerProfile        | Salon customer identity.                              | Belongs to a salon business and can have visits across branches.                   |
| Appointment            | Customer visit reservation or walk-in.                | Belongs to one branch and one salon business.                                      |
| Invoice                | Financial record.                                     | Belongs to one legal invoice scope, branch, salon business, and customer.          |
| StockMovement          | Inventory ledger entry.                               | Belongs to one product and one branch.                                             |

## Configuration Inheritance

Configuration must resolve in this order:

1. Branch override.
2. Salon business default.
3. Tenant/platform default.

This applies to:

- cancellation policy;
- booking lead time;
- no-show grace time;
- service visibility and branch pricing;
- allowed payment modes;
- invoice numbering profile;
- notification templates and channels;
- inventory low-stock threshold default.

Resolved configuration must be snapshotted when it affects historical transactions such as appointments, invoices, payments, or stock movement.

## Ownership And Scope Rules

- A user can own or access multiple salon businesses under one tenant.
- A user can have different roles per salon business and per branch.
- Branch-scoped operations must require branch access.
- Business-scoped operations must require salon business access.
- Cross-business reporting is allowed only for tenant owners or explicitly delegated users.
- Customers are scoped to a salon business, not a single branch.
- Appointments, invoices, stock, and branch shifts are branch-scoped.
- Service definitions are business-scoped; branch overrides are branch-scoped.

## Release Boundary

MVP implementation must support the data and authorization shape for multi-business and multi-branch ownership. MVP screens can initially expose a single selected business and branch if delivery scope requires it, but APIs and persistence must include business and branch scope where relevant.
