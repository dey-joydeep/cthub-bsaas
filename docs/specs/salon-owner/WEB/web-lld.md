# Salon Owner Web LLD

**Date:** 2026-05-11
**Status:** Implementation baseline

## Purpose

Define implementation-ready Angular Partner web details for Salon Owner MVP screens. This LLD is the frontend companion to the FRD, HLD, LLD service contracts, and OpenAPI contract.

## Source Documents

- [Business Operating Model](../FRD/business-operating-model.md)
- [Business Rules](../FRD/business-rules.md)
- [Permissions Matrix](../FRD/permissions-matrix.md)
- [Web HLD](../HLD/web-hld.md)
- [Validation Index](../VALIDATION/README.md)
- [OpenAPI Contract](../API/openapi.yaml)

## Library Layout

```text
libs/web/partner/src/lib/
  shell/
    partner-shell.component.ts
    partner-nav.model.ts
  context/
    business-context.service.ts
    business-context.model.ts
    branch-context.model.ts
    permission-capability.model.ts
  features/
    dashboard/
    appointments/
    pos/
    customers/
    services/
    staff/
    inventory/
    settings/
      business/
      branches/
```

If the existing repository layout differs, generators must preserve Nx project boundaries and package-root imports.

## Shared Web Models

### `BusinessContextModel`

Required fields:

- `tenantId`
- `salonBusinessId`
- `salonBusinessName`
- `allowedBusinessIds`
- `selectedBranchId`
- `allowedBranchIds`
- `roles`
- `capabilities`

### `PermissionCapabilityModel`

Required fields:

- `capability`
- `scope`
- `allowed`
- `reasonMessageKey`

### `PageLoadStateModel<T>`

Required fields:

- `status`: `idle | loading | ready | empty | forbidden | error`
- `data`
- `messageKey`
- `correlationId`

All object params and returns must use named interfaces/classes.

## API Service Mapping

| Web service           | OpenAPI operations                                                                                   |
| --------------------- | ---------------------------------------------------------------------------------------------------- |
| `BusinessSettingsApi` | `listSalonBusinesses`, `getSalonBusiness`, `createSalonBusiness`, `updateSalonBusiness`, branch APIs |
| `StaffApi`            | `listStaff`, `createStaff`, `getStaff`, `updateStaff`, roles, skills, shifts, leave APIs             |
| `ServiceCatalogApi`   | `listServiceCategories`, `createServiceCategory`, service CRUD, status, eligibility APIs             |
| `CustomerCrmApi`      | `searchCustomers`, customer CRUD, notes, preferences, visit history APIs                             |
| `AppointmentApi`      | day board, slots, create, walk-in, detail, reschedule, status transition APIs                        |
| `PosApi`              | checkout context, invoice create/detail/finalize, payment capture, pending dues APIs                 |
| `InventoryApi`        | product CRUD, branch stock, stock movement, stock adjustment, low-stock APIs                         |
| `DashboardApi`        | owner dashboard and alert APIs                                                                       |

Rules:

- API services return DTOs, not UI models.
- Feature mappers convert DTOs to UI models.
- API DTOs keep dates as ISO strings and money as strings.
- Request builders must include active `businessId` and `branchId` where the OpenAPI operation requires scope.
- Idempotency key generation must be used for appointment creation, invoice finalization, payment capture, and stock adjustment.

## Shell And Context

### `PartnerShellComponent`

Responsibilities:

- render primary navigation based on capabilities;
- render business selector when more than one business is allowed;
- render branch selector when more than one branch is allowed;
- show selected scope in the shell header;
- clear branch-scoped route state when selected business or branch changes;
- surface session expiry and global API errors.

### `BusinessContextService`

Responsibilities:

- load allowed businesses and branches after authentication;
- persist last selected business/branch only in browser-safe guarded storage;
- validate persisted selection against server-permitted context;
- expose readonly context signal/observable;
- expose capability lookup for route guards and UI actions.

Browser storage access must be guarded for SSR.

## Route-Level Implementation

| Route                          | Page component                  | Required guards                                             |
| ------------------------------ | ------------------------------- | ----------------------------------------------------------- |
| `/dashboard`                   | `OwnerDashboardPage`            | auth, business context, permission                          |
| `/appointments`                | `AppointmentDayBoardPage`       | auth, business context, branch context, permission          |
| `/appointments/new`            | `BookingPage`                   | auth, business context, branch context, permission          |
| `/appointments/:appointmentId` | `AppointmentDetailPage`         | auth, business context, branch context, permission          |
| `/walk-ins`                    | `WalkInQueuePage`               | auth, business context, branch context, permission          |
| `/pos/checkout/:appointmentId` | `CheckoutPage`                  | auth, business context, branch context, permission          |
| `/pos/invoices/:invoiceId`     | `InvoiceDetailPage`             | auth, business context, branch context, permission          |
| `/customers`                   | `CustomerSearchPage`            | auth, business context, permission                          |
| `/customers/:customerId`       | `CustomerProfilePage`           | auth, business context, permission                          |
| `/services`                    | `ServiceCatalogPage`            | auth, business context, permission                          |
| `/staff`                       | `StaffDirectoryPage`            | auth, business context, permission                          |
| `/inventory`                   | `InventoryDashboardPage`        | auth, business context, branch context, permission          |
| `/settings/business`           | `BusinessSettingsPage`          | auth, business context, permission, unsaved changes         |
| `/settings/business/legal`     | `LegalRegistrationSettingsPage` | auth, business context, permission, unsaved changes         |
| `/settings/branches`           | `BranchListSettingsPage`        | auth, business context, permission                          |
| `/settings/branches/:branchId` | `BranchSettingsPage`            | auth, business context, branch context, permission, unsaved |

## Screen Contracts

### Dashboard

Inputs:

- active `salonBusinessId`;
- optional `branchId`;
- business date.

Displays:

- appointment counts by status;
- walk-in queue summary;
- finalized revenue and captured payment summary;
- pending dues;
- low-stock alert count;
- operational alerts.

Actions:

- navigate to booking;
- navigate to walk-ins;
- navigate to checkout/pending dues;
- navigate to low-stock products.

Rules:

- owner can view cross-branch dashboard when permitted;
- branch manager sees assigned branch data only;
- financial metrics must display server-calculated values only.

### Appointments

Pages/components:

- `AppointmentDayBoardPage`
- `BookingFormComponent`
- `WalkInQueueComponent`
- `AppointmentDetailDrawerComponent`
- `AppointmentStatusActionMenuComponent`
- `RescheduleAppointmentDialog`
- `CancelAppointmentDialog`

State:

- selected business;
- selected branch;
- selected branch-local date;
- staff/service filters;
- day-board load state;
- selected appointment detail state.

Required behavior:

- day board loads by branch and date;
- slot search calls server with branch, services, date, and staff preference;
- booking commit waits for server response;
- conflict response shows message and correlation ID;
- override action is shown only when capability allows it;
- cancel/no-show requires reason;
- completion action enables checkout navigation.

### POS

Pages/components:

- `CheckoutPage`
- `InvoicePreviewComponent`
- `PaymentCaptureDialog`
- `PendingDuesPage`

State:

- checkout context loaded from server;
- invoice draft/detail;
- payment entry form;
- pending due list filter.

Required behavior:

- checkout context must not be built from stale appointment UI state;
- totals must be server-calculated;
- finalize invoice uses idempotency key;
- payment capture uses idempotency key;
- partial payment shows due amount from server;
- finalized invoice lines are read-only;
- forbidden discount/payment actions show permission message.

### Customers

Pages/components:

- `CustomerSearchPage`
- `CustomerProfilePage`
- `CustomerNotesPanel`
- `CustomerVisitHistoryPanel`
- `CommunicationPreferencesForm`

State:

- business-scoped search query;
- selected customer;
- note visibility capability;
- visit history pagination.

Required behavior:

- customer search is scoped to salon business, not branch;
- visit history can include visits from any branch in the same business;
- restricted notes are hidden unless capability allows view;
- customer duplicate warnings do not auto-merge;
- marketing preferences are channel-specific.

### Services

Pages/components:

- `ServiceCatalogPage`
- `ServiceCategoryManagerComponent`
- `ServiceEditorDialog`
- `BranchServiceOverridePanel`
- `StaffEligibilitySelector`

State:

- business-scoped service list;
- selected branch for override view;
- category filters;
- active/inactive filter.

Required behavior:

- service definitions are business-scoped;
- branch override form edits branch-specific price, duration, visibility, and staff eligibility;
- inactive services cannot be selected for new booking flows;
- historical snapshots are explained through read-only transaction screens, not edited here.

### Staff

Pages/components:

- `StaffDirectoryPage`
- `StaffProfilePage`
- `StaffRoleEditor`
- `StaffSkillEditor`
- `ShiftPlannerComponent`
- `LeaveBlockDialog`

State:

- business-scoped staff directory;
- branch assignment filter;
- selected staff profile;
- role/skill/shift form state.

Required behavior:

- branch manager sees assigned branch staff only;
- owner can manage cross-branch assignments;
- role changes require permission and audit-triggering server mutation;
- shift/leave changes refresh appointment availability state after save;
- deactivated staff remains visible in historical records.

### Inventory

Pages/components:

- `InventoryDashboardPage`
- `ProductCatalogPage`
- `BranchStockTable`
- `StockAdjustmentDialog`
- `LowStockAlertsPanel`

State:

- selected branch;
- product search;
- branch stock pagination;
- stock movement form.

Required behavior:

- stock is branch-scoped;
- stock movement requires reason;
- stock adjustment uses idempotency key;
- negative stock conflict displays server message;
- low-stock alerts use server-provided threshold and current stock.

### Settings

Pages/components:

- `BusinessSettingsPage`
- `LegalRegistrationSettingsPage`
- `BranchListSettingsPage`
- `BranchSettingsPage`
- `BranchHoursForm`
- `BranchHolidayForm`
- `BranchPolicyForm`

State:

- selected business;
- selected branch;
- dirty form state;
- last saved configuration.

Required behavior:

- business settings are separate from branch settings;
- legal/tax settings are permission-restricted;
- branch hour changes warn that existing appointments are not automatically changed;
- tax/invoice numbering changes explain that existing invoices are unaffected;
- every settings save reloads canonical server state.

## Forms And Validation

Frontend forms must implement [Validation Index](../VALIDATION/README.md). Server validation remains authoritative.

## Error And Empty States

Each page must implement:

- loading state;
- empty state;
- forbidden state;
- validation error state;
- conflict error state;
- network/server error state with correlation ID;
- stale context state when business/branch is no longer allowed.

Conflict handling:

- appointment overlap: show conflict message and reload day board;
- payment overpay: show server due amount and reload invoice;
- negative stock: show current stock and reload branch stock;
- forbidden action: show permission message and keep user on current screen.

## Accessibility

- Route-level headings must identify the current business/branch context.
- Calendar/day board cells must be keyboard reachable.
- Dialogs/drawers must trap and restore focus.
- Action menus must expose accessible names.
- Status must not be communicated by color alone.
- Form errors must be linked to controls.
- Invoice totals and payment amounts must be readable by screen readers.

## SSR Safety

- No top-level access to browser globals.
- Guard `localStorage`, `sessionStorage`, `window`, `document`, `ResizeObserver`, and print APIs.
- Use Angular platform checks before browser-only behavior.
- Business-context persistence must degrade safely during server render.

## Test Requirements

Minimum web tests:

- business/branch context guard behavior;
- route permission guard behavior;
- dashboard branch filter state;
- booking form validation and conflict handling;
- checkout server-total display and payment validation;
- customer restricted-note visibility;
- branch override service form;
- staff role/shift permission behavior;
- stock adjustment reason/idempotency behavior;
- settings unsaved-changes guard;
- SSR safety for shell/context services.
