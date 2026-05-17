# Salon Owner Service Contracts LLD

**Date:** 2026-05-11
**Status:** Implementation baseline

## Purpose

Define the major ports, commands, DTOs, and read models developers must create or map to existing packages. Names can be adjusted to existing package conventions; the boundaries and business rules must remain.

## Contracts Package Strategy

Contract package options:

- `libs/server/contracts-salon-operations`
- or split by feature if the repo prefers smaller packages:
  - `server-contracts-branch`
  - `server-contracts-staff`
  - `server-contracts-service-catalog`
  - `server-contracts-customer-crm`
  - `server-contracts-appointment`
  - `server-contracts-billing`
  - `server-contracts-inventory`

Use one contract package for MVP unless the implementation team decides to split by feature before coding starts.

## Repository Ports

| Port                           | Responsibility                                                     |
| ------------------------------ | ------------------------------------------------------------------ |
| `BranchRepositoryPort`         | Branch, hours, holidays, policy persistence.                       |
| `StaffRepositoryPort`          | Staff profile, roles, skills, shifts, leave.                       |
| `ServiceCatalogRepositoryPort` | Categories, services, staff eligibility.                           |
| `CustomerRepositoryPort`       | Customer profile, notes, preferences, visit history read pointers. |
| `AppointmentRepositoryPort`    | Appointment lifecycle persistence and overlap queries.             |
| `InvoiceRepositoryPort`        | Invoice draft/finalized persistence.                               |
| `PaymentRepositoryPort`        | Payment capture persistence and outstanding balance reads.         |
| `InventoryRepositoryPort`      | Product, branch stock, stock movement ledger.                      |
| `DashboardReadPort`            | Dashboard read model queries.                                      |
| `AuditPort`                    | Business/security audit event recording.                           |
| `NotificationPort`             | Transactional notification dispatch.                               |

## Key Query Ports

| Port                      | Used by          | Purpose                                         |
| ------------------------- | ---------------- | ----------------------------------------------- |
| `StaffAvailabilityPort`   | Appointment      | Shift/leave/booking availability.               |
| `ServiceSnapshotPort`     | Appointment, POS | Service name/duration/price/tax snapshot.       |
| `CustomerSummaryPort`     | Appointment, POS | Customer display/contact summary.               |
| `AppointmentCheckoutPort` | POS              | Completed appointment lines for checkout.       |
| `BranchPolicyPort`        | Appointment, POS | Cancellation/booking/payment policies.          |
| `InventoryStockPort`      | POS/Inventory    | Product availability and future sale deduction. |

## Command DTO Naming

Use command DTO classes for writes:

- `CreateAppointmentDto`
- `RescheduleAppointmentDto`
- `CancelAppointmentDto`
- `CreateInvoiceDraftDto`
- `FinalizeInvoiceDto`
- `CapturePaymentDto`
- `AdjustStockDto`

Use query DTO classes for reads:

- `AvailableSlotQueryDto`
- `DayBoardQueryDto`
- `CustomerSearchQueryDto`
- `PendingDueQueryDto`
- `DashboardQueryDto`

## Read Model DTOs

### `OwnerDashboardDto`

Properties:

- `date`: ISO date string.
- `branchId`: selected branch or null for all allowed branches.
- `appointments`: appointment count/status summary.
- `walkIns`: walk-in count/status summary.
- `revenue`: revenue snapshot from finalized invoices/payments.
- `pendingDues`: due amount/count.
- `lowStock`: low-stock count/top alerts.
- `alerts`: operational alerts.
- `meta`: includes `correlationId` where envelope uses metadata.

### `AppointmentDetailDto`

Properties:

- `id`
- `tenantId`
- `salonBusinessId`
- `branchId`
- `customer`
- `status`
- `source`
- `startsAt`
- `endsAt`
- `lines`
- `notes`
- `policyContext`
- `auditSummary`

### `InvoiceDetailDto`

Properties:

- `id`
- `tenantId`
- `salonBusinessId`
- `branchId`
- `customer`
- `appointmentId`
- `status`
- `lines`
- `totals`
- `payments`
- `dueAmount`
- `finalizedAt`

### `BranchStockDto`

Properties:

- `productId`
- `branchId`
- `quantityOnHand`
- `lowStockThreshold`
- `isLowStock`
- `lastMovementAt`

## Event Payloads

Events must be plain serializable objects:

- `AppointmentBookedEvent`
- `AppointmentStatusChangedEvent`
- `InvoiceFinalizedEvent`
- `PaymentCapturedEvent`
- `StockMovementRecordedEvent`
- `BranchSettingsChangedEvent`

Each event includes:

- `eventId`
- `occurredAt`
- `tenantId`
- `salonBusinessId`
- `branchId?`
- `actorUserId?`
- `correlationId?`
- domain-specific identifiers.

## Validation Rules

Validation ownership and per-form/per-command constraints are defined in [Validation Index](../VALIDATION/README.md). At minimum:

- IDs are UUID strings.
- Money strings validate as decimal with configured scale.
- Date ranges require `startsAt < endsAt`.
- Appointment line service IDs must belong to the same salon business.
- Staff IDs must belong to branch/salon business scope.
- Payment amount must be positive.
- Stock adjustment reason is required.
