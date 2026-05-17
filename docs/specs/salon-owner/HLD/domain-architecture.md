# Salon Owner Domain Architecture HLD

**Date:** 2026-05-11
**Status:** Implementation baseline

## Purpose

Define bounded contexts and module dependencies for the Salon Owner MVP.

## Bounded Contexts

| Context           | Backend project target                                    | Primary ownership                                                     |
| ----------------- | --------------------------------------------------------- | --------------------------------------------------------------------- |
| Business Settings | `server-feature-salon` or new business/settings feature   | Salon business, legal registration, branch profile, hours, policies.  |
| Staff Operations  | `server-feature-salon-staff-request` or new staff feature | Staff profiles, role assignment, skills, shifts, leave.               |
| Service Catalog   | new or existing service/catalog feature                   | Service categories, service definitions, staff eligibility.           |
| Customer CRM      | `server-feature-user` plus CRM feature if needed          | Salon customer records, notes, preferences, visit history read model. |
| Appointments      | `server-feature-appointment`                              | Appointment and walk-in lifecycle.                                    |
| Billing/POS       | new billing/POS feature                                   | Invoice, payment, dues.                                               |
| Inventory         | new inventory feature                                     | Products, branch stock, stock movements.                              |
| Dashboard         | `server-feature-dashboard`                                | Read-model aggregation.                                               |
| Reporting         | future reporting feature                                  | Export and historical analytics.                                      |
| Notifications     | existing/future infrastructure adapter                    | Transactional notification events.                                    |

Exact project names must follow Nx conventions selected during implementation; these bounded contexts must remain stable.

## Domain Dependencies

| Context           | Allowed dependencies                                                                       | Forbidden dependencies               |
| ----------------- | ------------------------------------------------------------------------------------------ | ------------------------------------ |
| Business Settings | auth/core, data-access                                                                     | appointment internals, POS internals |
| Staff Operations  | branch settings, auth/core                                                                 | POS internals                        |
| Service Catalog   | branch settings, staff read ports                                                          | appointment internals                |
| Customer CRM      | auth/core, branch read ports                                                               | POS internals                        |
| Appointments      | branch, staff, services, customer read ports                                               | POS concrete services                |
| Billing/POS       | appointment checkout port, customer read port, service snapshot port, inventory stock port | appointment repository internals     |
| Inventory         | branch settings                                                                            | POS internals                        |
| Dashboard         | read ports from features                                                                   | mutation services                    |

## Core Aggregates

| Aggregate       | Context           | Notes                                          |
| --------------- | ----------------- | ---------------------------------------------- |
| SalonBusiness   | Business Settings | Business and default configuration root.       |
| Branch          | Business Settings | Operational branch configuration root.         |
| StaffProfile    | Staff Operations  | App user plus operational staff profile.       |
| Service         | Service Catalog   | Service definition and branch overrides later. |
| CustomerProfile | Customer CRM      | Salon-facing customer identity.                |
| Appointment     | Appointments      | Booking/walk-in lifecycle root.                |
| Invoice         | Billing/POS       | Financial transaction root.                    |
| Payment         | Billing/POS       | Payment captured against invoice.              |
| Product         | Inventory         | Retail product master.                         |
| StockMovement   | Inventory         | Ledger entry for inventory changes.            |

## Application Services

| Service                    | Responsibility                                                                |
| -------------------------- | ----------------------------------------------------------------------------- |
| BusinessSettingsService    | Create/update salon business, legal registrations, branches, hours, policies. |
| StaffService               | Manage staff profile, skills, role, shifts, leave.                            |
| ServiceCatalogService      | Manage categories and services.                                               |
| CustomerCrmService         | Search/create/update customer profile and notes.                              |
| AppointmentService         | Create/reschedule/cancel/no-show appointments and manage walk-ins.            |
| SlotAvailabilityService    | Calculate candidate slots and validate booking commits.                       |
| CheckoutService            | Build checkout context from appointment/walk-in/customer/service data.        |
| InvoiceService             | Create draft, finalize invoice, manage due amount.                            |
| PaymentService             | Capture payment records and update invoice balance.                           |
| InventoryService           | Manage product and stock movement ledger.                                     |
| OwnerDashboardQueryService | Build dashboard read model.                                                   |

## Domain Events

MVP must define events even when handlers are synchronous or stored only for later processing.

| Event                    | Publisher       | Consumers                                 |
| ------------------------ | --------------- | ----------------------------------------- |
| BranchSettingsChanged    | Branch Settings | Dashboard cache, audit                    |
| StaffAvailabilityChanged | Staff           | Appointment slot cache/read model         |
| ServiceChanged           | Service Catalog | Appointment slot/search read model        |
| CustomerCreated          | Customer CRM    | Audit, future marketing                   |
| AppointmentBooked        | Appointment     | Notification, dashboard                   |
| AppointmentStatusChanged | Appointment     | Dashboard, notification                   |
| InvoiceFinalized         | Billing/POS     | Dashboard, reporting, inventory extension |
| PaymentCaptured          | Billing/POS     | Dashboard, reporting                      |
| StockMovementRecorded    | Inventory       | Dashboard, reporting                      |

## Authorization Model

Minimum roles:

- Owner: all branch and business operations.
- Branch Manager: assigned branch operations/settings except sensitive financial/platform settings.
- Front Desk: booking, walk-in, customer lookup, checkout where allowed.
- Service Staff: schedule view, assigned appointment status updates, allowed customer service notes.
- Cashier: checkout/payment operations.
- Accountant: reports and invoice/payment views.

Authorization must enforce:

- tenant/salon business scope;
- branch scope;
- role permissions;
- operation-level restrictions such as refund/override/settings.
