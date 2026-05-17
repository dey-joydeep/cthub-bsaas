# Salon Owner MVP HLD Overview

**Date:** 2026-05-11
**Status:** Implementation baseline

## Purpose

Define the high-level architecture for the Salon Owner MVP operational core. This HLD consumes the FRD/FNRD layer and gives developers enough structure to start backend, frontend, API, database, and test design without guessing product boundaries.

## Business Requirement Source

Implementation decisions in this HLD are based on:

- [Business Operating Model](../FRD/business-operating-model.md)
- [Business Rules](../FRD/business-rules.md)
- [Permissions Matrix](../FRD/permissions-matrix.md)
- [Non-Functional Requirements](../FNRD/non-functional-requirements.md)

## MVP Scope

Included business foundation:

- Tenant, salon business, legal registration, and branch scope.
- Multi-business and multi-branch capable authorization model.
- Business-level defaults with branch-level overrides.

Included operational modules:

- Branch settings: branch profile, hours, holidays, cancellation policy.
- Staff: profile, role, branch assignment, skills, shifts, leave/block time.
- Services: categories, service definitions, duration, price, staff eligibility.
- Customers: search, profile, visit history, notes, communication preference.
- Appointments: booking, walk-in queue, calendar/day board, lifecycle status, reschedule, cancel, no-show.
- Billing/POS: checkout, invoice, UPI/cash/card capture, split payment, pending dues.
- Inventory: retail stock, stock adjustment, low-stock alert.
- Dashboard: today's appointments, walk-ins, revenue snapshot, pending dues, low-stock alerts.

Out of MVP but planned as extension points:

- GST-complete accounting workflow.
- Refunds and daily closing.
- Staff attendance and commission payouts.
- Professional-use service consumption.
- Packages, loyalty, campaigns, review automation.
- Public discovery/marketplace.
- Advanced analytics/report builder.

## Architecture Style

Use the existing Nx/NestJS/Angular monorepo structure:

- Backend feature libraries under `libs/server/features/**`.
- Backend contracts/ports under `libs/server/contracts-*`.
- Concrete persistence/adapters under `libs/server/infrastructure`.
- Shared DTO/error/message keys under `libs/shared`.
- Web app-specific feature UX under `libs/web/partner/**` first for owner/staff operations.
- Reusable UI primitives under `libs/web/ui`.

## High-Level Components

| Component                 | Responsibility                                                         |
| ------------------------- | ---------------------------------------------------------------------- |
| Partner Web App           | Owner/front-desk/staff operational UI.                                 |
| API App                   | HTTP entry point, auth, request envelope, correlation, global filters. |
| Business Settings Feature | Salon business, legal registration, branch profile, hours, policies.   |
| Staff Feature             | Staff profile, role, branch assignment, skills, shifts/leave.          |
| Service Catalog Feature   | Services, categories, branch overrides, staff eligibility.             |
| Customer CRM Feature      | Customer profile, notes, visit history, communication preferences.     |
| Appointment Feature       | Slot lookup, booking, walk-ins, lifecycle transitions.                 |
| Billing/POS Feature       | Invoice draft/finalize, payments, dues.                                |
| Inventory Feature         | Product catalog, stock state, stock movement, alerts.                  |
| Dashboard Feature         | Read-model aggregation across operational features.                    |
| Data Access               | Prisma repositories and transactions.                                  |

## Dependency Direction

- Features depend on contracts and core utilities, not concrete infrastructure.
- Infrastructure implements repository/adapter ports.
- Dashboard depends on read ports from feature contracts, not feature services directly.
- Billing/POS reads appointment/customer/service/staff data through ports or application services designed for checkout.
- Appointment slotting reads staff, service, and branch availability through ports.
- Inventory is independent for MVP except POS retail sale stock deduction extension point.

## MVP Vertical Slice Order

1. Business and branch settings foundation.
2. Staff foundation.
3. Service catalog.
4. Customer CRM.
5. Appointment booking and walk-in lifecycle.
6. Billing/POS and payments/dues.
7. Inventory retail stock and low-stock alerts.
8. Owner dashboard read model.

## Cross-Cutting Requirements

- All mutations require authentication and tenant/branch authorization.
- Every financial, scheduling override, staff permission, settings, stock adjustment, and customer-merge operation must be auditable.
- Error responses use centralized shared message keys and consistent response envelope.
- API responses include correlation IDs where supported by global middleware/filter/interceptors.
- All dates/times at API boundaries use ISO strings; business logic stores and compares UTC.
- UI must be SSR-safe and accessible.

## Key Architecture Decisions

| Decision                                                    | Rationale                                                         |
| ----------------------------------------------------------- | ----------------------------------------------------------------- |
| Start with Partner app operational scope                    | Salon owner MVP is the commercial core.                           |
| Keep module boundaries aligned to business capabilities     | Avoid large shared operational feature that becomes hard to test. |
| Use explicit lifecycle states for appointments and invoices | Prevent ambiguous status transitions.                             |
| Use stock movement ledger for inventory                     | Enables auditability and future reporting.                        |
| Use read models for dashboard                               | Avoid dashboard becoming transaction owner.                       |
| Keep V1 automation behind ports/events                      | Enables reminders/campaigns later without rewriting core flows.   |

## Risks

| Risk                                               | Mitigation                                                                |
| -------------------------------------------------- | ------------------------------------------------------------------------- |
| Over-coupled appointment/POS/customer/service code | Define ports and command boundaries in LLD.                               |
| Inconsistent financial totals                      | Invoice finalization must be transactional and immutable.                 |
| Double-booking staff                               | Slot search and booking commit must re-check availability in transaction. |
| Tenant data leakage                                | Tenant/branch authorization must be server-side and tested.               |
| Scope creep from V1 features                       | Keep extension points but implement only MVP flows first.                 |
