# Salon Owner Data Model HLD

**Date:** 2026-05-11
**Status:** Implementation baseline

The tenant, business, and branch scope decision is documented in [ADR-0004](../../../architecture/decisions/0004-tenant-business-branch-scope.md). This HLD defines the data design and its transitional implementation limits.

## Purpose

Define the MVP data model at a high level. This is not a Prisma migration yet; it guides schema design and LLD.

## Entity Overview

| Entity                 | Purpose                              | Key relationships                                                    |
| ---------------------- | ------------------------------------ | -------------------------------------------------------------------- |
| Tenant                 | Platform account boundary.           | Has users, subscriptions, salon businesses.                          |
| SalonBusiness          | Salon business/brand root.           | Belongs to Tenant; has branches, services, customers, staff.         |
| SalonLegalRegistration | Legal/tax registration profile.      | Belongs to SalonBusiness; used by invoice numbering/tax.             |
| Branch                 | Physical operating location.         | Belongs to SalonBusiness; has hours, staff, appointments, stock.     |
| BranchHours            | Weekly operating hours.              | Belongs to Branch.                                                   |
| BranchHoliday          | Closed/special dates.                | Belongs to Branch.                                                   |
| BranchPolicy           | Cancellation/no-show/booking policy. | Belongs to Branch.                                                   |
| StaffProfile           | Operational staff profile.           | Links User, SalonBusiness, Branches, roles, skills.                  |
| StaffShift             | Working schedule.                    | Belongs to StaffProfile and Branch.                                  |
| StaffLeaveBlock        | Leave/blocked time.                  | Belongs to StaffProfile.                                             |
| ServiceCategory        | Service grouping.                    | Belongs to SalonBusiness.                                            |
| Service                | Bookable/billable service.           | Belongs to SalonBusiness/category; references eligible skills/staff. |
| BranchServiceOverride  | Branch-specific service override.    | Belongs to Branch and Service.                                       |
| CustomerProfile        | Salon customer record.               | Belongs to SalonBusiness; can link app user later.                   |
| CustomerNote           | Staff/customer note.                 | Belongs to CustomerProfile.                                          |
| Appointment            | Scheduled or walk-in visit.          | Belongs to SalonBusiness, Branch, CustomerProfile.                   |
| AppointmentLine        | Service line inside appointment.     | References Service and assigned StaffProfile.                        |
| Invoice                | Final or draft bill.                 | Belongs to SalonBusiness/Branch/Customer; can reference Appointment. |
| InvoiceLine            | Financial line item.                 | References service/product/package snapshots.                        |
| Payment                | Payment captured against invoice.    | Belongs to Invoice.                                                  |
| Product                | Retail product master.               | Belongs to SalonBusiness.                                            |
| BranchStock            | Current stock cache.                 | Product + Branch.                                                    |
| StockMovement          | Inventory ledger.                    | Product + Branch; invoice reference when caused by sale.             |
| AuditLog               | Security/business audit trail.       | Actor, action, target, correlation ID.                               |

## Key Enums

### AppointmentStatus

- `DRAFT`
- `BOOKED`
- `CONFIRMED`
- `ARRIVED`
- `IN_SERVICE`
- `COMPLETED`
- `CANCELLED`
- `NO_SHOW`

### AppointmentSource

- `STAFF_CREATED`
- `CUSTOMER_ONLINE`
- `WALK_IN`

### InvoiceStatus

- `DRAFT`
- `FINALIZED`
- `PARTIALLY_PAID`
- `PAID`
- `VOID`

Refund-specific states are V1 unless required by POS MVP.

### PaymentMode

- `CASH`
- `UPI`
- `CARD`
- `ONLINE`
- `PACKAGE`
- `COUPON`
- `OTHER`

### StockMovementType

- `OPENING`
- `PURCHASE`
- `SALE`
- `ADJUSTMENT`
- `TRANSFER_IN`
- `TRANSFER_OUT`
- `DAMAGE`
- `EXPIRY`

Professional consumption is V1; reserve `SERVICE_CONSUMPTION` as the stock movement type.

## Lifecycle Rules

### Appointment

Allowed MVP transitions:

- `DRAFT -> BOOKED`
- `BOOKED -> CONFIRMED`
- `BOOKED|CONFIRMED -> ARRIVED`
- `ARRIVED -> IN_SERVICE`
- `IN_SERVICE -> COMPLETED`
- `BOOKED|CONFIRMED|ARRIVED -> CANCELLED`
- `BOOKED|CONFIRMED -> NO_SHOW`

Any override must capture actor, reason, previous state, next state, and timestamp.

### Invoice

Allowed MVP transitions:

- `DRAFT -> FINALIZED`
- `FINALIZED -> PARTIALLY_PAID`
- `FINALIZED -> PAID`
- `PARTIALLY_PAID -> PAID`
- `DRAFT -> VOID`

Finalized invoice lines are immutable. Corrections require future adjustment/credit-note workflow.

### Stock

`BranchStock.quantityOnHand` is a derived/cache value from `StockMovement`, updated transactionally when a movement is recorded.

## Snapshot Requirements

Financial and appointment historical records must snapshot mutable reference data:

- service name, duration, price at booking/checkout time;
- staff display name at service time;
- product name, SKU, price at sale time;
- branch display name/address on invoice;
- tax/payment config used at invoice time.

## Multi-Tenant Constraints

- Every business entity must include `tenantId` and `salonBusinessId` unless it is purely tenant-level.
- Branch-scoped entities must include `branchId`.
- Query filters must enforce tenant/business/branch scope server-side.
- Unique constraints must be scoped appropriately, for example service name unique per salon business/category where required.

## Transitional Implementation Note

- Current operational flows still reference the legacy `Salon` aggregate by `salonId`.
- During the branch-settings rollout, each `Branch` persists a matching operational `Salon` record with the same UUID so existing appointment, invite, staff, and auth flows stay branch-addressable while the model converges.

## Indexing Guidance

Required indexes:

- `SalonBusiness(tenantId, status)`
- `SalonLegalRegistration(salonBusinessId, status)`
- `Branch(salonBusinessId, status)`
- `StaffProfile(salonBusinessId, status)`
- `StaffShift(staffId, branchId, startsAt, endsAt)`
- `Service(salonBusinessId, status)`
- `CustomerProfile(salonBusinessId, phone/email normalized)`
- `Appointment(salonBusinessId, branchId, startsAt, status)`
- `AppointmentLine(staffId, startsAt, endsAt)`
- `Invoice(salonBusinessId, branchId, finalizedAt, status)`
- `Payment(invoiceId, mode)`
- `StockMovement(productId, branchId, createdAt)`
- `BranchStock(branchId, productId)`
