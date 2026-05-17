# Salon Owner MVP LLD

**Date:** 2026-05-11
**Status:** Implementation baseline

## Purpose

Provide detailed implementation guidance for Salon Owner MVP modules. This LLD implements the FRD/FNRD baseline and is scoped to production-ready MVP behavior without adding V1 automation.

## Business Rule Source

All module rules below must be implemented together with:

- [Business Operating Model](../FRD/business-operating-model.md)
- [Business Rules](../FRD/business-rules.md)
- [Permissions Matrix](../FRD/permissions-matrix.md)
- [Non-Functional Requirements](../FNRD/non-functional-requirements.md)
- [Validation Index](../VALIDATION/README.md)

## Implementation Sequence

1. Business And Branch Settings
2. Staff Operations
3. Service Catalog
4. Customer CRM
5. Appointment Lifecycle
6. Billing/POS
7. Inventory
8. Dashboard Read Model

## Shared Implementation Conventions

- Commands are DTO classes with validation decorators.
- DTO and service validation must enforce [Validation Index](../VALIDATION/README.md).
- Return objects with three or more properties use named interfaces/types.
- Money values in API DTOs are strings.
- Dates in API DTOs are ISO strings.
- Mutations are audited when they change settings, staff permissions, appointment state, invoice/payment state, stock, or customer sensitive data.
- All repository operations include `tenantId`, `salonBusinessId`, and, where applicable, `branchId`.
- All public API handlers use guards/interceptors from server core.

## Module: Business And Branch Settings

### Commands

- `CreateSalonBusinessCommand`
- `UpdateSalonBusinessCommand`
- `UpsertSalonLegalRegistrationCommand`
- `CreateBranchCommand`
- `UpdateBranchProfileCommand`
- `UpdateBranchHoursCommand`
- `SetBranchHolidayCommand`
- `UpdateBranchPolicyCommand`

### Core Rules

- Salon business belongs to exactly one tenant.
- Branch belongs to exactly one salon business.
- Branch status controls booking visibility.
- Hours/holiday changes do not mutate existing appointments.
- Policy changes apply to future operations only.

### Application Service Methods

- `createSalonBusiness(command): SalonBusinessDetailDto`
- `updateSalonBusiness(command): SalonBusinessDetailDto`
- `upsertLegalRegistration(command): SalonLegalRegistrationDto`
- `createBranch(command): BranchDetailDto`
- `updateBranchProfile(command): BranchDetailDto`
- `updateBranchHours(command): BranchHoursDto`
- `setBranchHoliday(command): BranchHolidayDto`
- `updateBranchPolicy(command): BranchPolicyDto`
- `getBranchDetail(query): BranchDetailDto`

### Persistence Notes

- Store weekly hours separately from holiday/special-date overrides.
- Branch policy can be one row per branch for MVP.

## Module: Staff Operations

### Commands

- `CreateStaffProfileCommand`
- `UpdateStaffProfileCommand`
- `AssignStaffRoleCommand`
- `AssignStaffSkillCommand`
- `SetStaffShiftCommand`
- `SetStaffLeaveBlockCommand`

### Core Rules

- Staff profile links to an authenticated user where available.
- Staff must be assigned to at least one branch to appear in booking.
- Deactivated staff cannot be selected for new appointments.
- Shift/leave controls availability.

### Application Service Methods

- `createStaff(command): StaffDetailDto`
- `updateStaff(command): StaffDetailDto`
- `setRole(command): StaffDetailDto`
- `setSkills(command): StaffDetailDto`
- `setShift(command): StaffShiftDto`
- `setLeaveBlock(command): StaffLeaveBlockDto`
- `listAvailableStaff(query): StaffAvailabilityDto[]`

### Persistence Notes

- Keep role assignment separate from skill assignment.
- Shifts and leave blocks are time-range records.

## Module: Service Catalog

### Commands

- `CreateServiceCategoryCommand`
- `CreateServiceCommand`
- `UpdateServiceCommand`
- `SetServiceActiveStatusCommand`
- `SetServiceStaffEligibilityCommand`

### Core Rules

- Service duration must be positive.
- Price must be non-negative decimal string at API boundary.
- Inactive services cannot be used for new bookings.
- Service changes do not mutate historical appointment/invoice snapshots.

### Application Service Methods

- `createCategory(command): ServiceCategoryDto`
- `createService(command): ServiceDetailDto`
- `updateService(command): ServiceDetailDto`
- `setServiceStatus(command): ServiceDetailDto`
- `setStaffEligibility(command): ServiceDetailDto`
- `listBookableServices(query): ServiceSummaryDto[]`

## Module: Customer CRM

### Commands

- `CreateCustomerCommand`
- `UpdateCustomerProfileCommand`
- `AddCustomerNoteCommand`
- `UpdateCommunicationPreferenceCommand`

### Core Rules

- Customer belongs to one salon business.
- Customer can exist without app login identity.
- Phone/email uniqueness is soft for MVP; duplicate warning is allowed.
- Restricted notes require role permission.

### Application Service Methods

- `searchCustomers(query): CustomerSearchResultDto[]`
- `createCustomer(command): CustomerDetailDto`
- `updateCustomer(command): CustomerDetailDto`
- `addNote(command): CustomerNoteDto`
- `updateCommunicationPreference(command): CustomerCommunicationPreferenceDto`
- `getCustomerVisitHistory(query): CustomerVisitHistoryDto`

## Module: Appointment Lifecycle

### Commands

- `CreateAppointmentCommand`
- `CreateWalkInCommand`
- `RescheduleAppointmentCommand`
- `CancelAppointmentCommand`
- `MarkNoShowCommand`
- `TransitionAppointmentStatusCommand`

### Core Rules

- Booking commit re-checks staff availability inside the transaction.
- Appointment line contains service snapshot.
- Appointment status transitions follow HLD lifecycle.
- Cancel/no-show captures reason.
- Walk-in starts without pre-booked slot but must still assign branch/customer.

### Application Service Methods

- `findAvailableSlots(query): AvailableSlotDto[]`
- `createAppointment(command): AppointmentDetailDto`
- `createWalkIn(command): AppointmentDetailDto`
- `rescheduleAppointment(command): AppointmentDetailDto`
- `cancelAppointment(command): AppointmentDetailDto`
- `markNoShow(command): AppointmentDetailDto`
- `transitionStatus(command): AppointmentDetailDto`
- `getDayBoard(query): DayBoardDto`

### Transaction Notes

For appointment creation/reschedule:

1. Load branch policy/hours.
2. Load service duration and eligible staff.
3. Validate requested slot.
4. Re-query overlapping appointment lines for staff.
5. Insert appointment and appointment lines.
6. Publish `AppointmentBooked`.

## Module: Billing/POS

### Commands

- `CreateInvoiceDraftCommand`
- `FinalizeInvoiceCommand`
- `CapturePaymentCommand`
- `MarkDueCommand`

### Core Rules

- Invoice lines snapshot service/product/customer/branch display data.
- Finalized invoice lines are immutable.
- Payments cannot exceed outstanding amount unless overpayment policy is defined.
- Partial payment creates due balance.

### Application Service Methods

- `getCheckoutContext(query): CheckoutContextDto`
- `createInvoiceDraft(command): InvoiceDetailDto`
- `finalizeInvoice(command): InvoiceDetailDto`
- `capturePayment(command): PaymentDto`
- `getPendingDues(query): PendingDueDto[]`

### Transaction Notes

For invoice finalization:

1. Validate invoice draft and branch scope.
2. Recalculate totals server-side.
3. Snapshot invoice lines.
4. Set status to `FINALIZED`, `PARTIALLY_PAID`, or `PAID` based on payment.
5. Publish `InvoiceFinalized`.

## Module: Inventory

### Commands

- `CreateProductCommand`
- `UpdateProductCommand`
- `RecordStockMovementCommand`
- `AdjustStockCommand`
- `SetLowStockThresholdCommand`

### Core Rules

- Stock movement ledger is authoritative.
- Current stock cache updates transactionally.
- Negative stock requires explicit policy/permission.
- Low-stock alert uses branch/product threshold.

### Application Service Methods

- `createProduct(command): ProductDetailDto`
- `updateProduct(command): ProductDetailDto`
- `recordMovement(command): StockMovementDto`
- `adjustStock(command): StockMovementDto`
- `getLowStockAlerts(query): LowStockAlertDto[]`
- `getBranchStock(query): BranchStockDto[]`

## Module: Dashboard

### Query Methods

- `getOwnerDashboard(query): OwnerDashboardDto`
- `getTodayAppointments(query): DashboardAppointmentDto[]`
- `getRevenueSnapshot(query): RevenueSnapshotDto`
- `getPendingDuesSnapshot(query): PendingDueSnapshotDto`
- `getLowStockSnapshot(query): LowStockSnapshotDto`

### Core Rules

- Dashboard is read-only.
- Dashboard totals must come from finalized invoices/payments where financial.
- Dashboard respects branch permissions.
