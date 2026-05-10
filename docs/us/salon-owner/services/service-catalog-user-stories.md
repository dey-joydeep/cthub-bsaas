# Service Catalog User Stories

**Date:** 2026-05-11
**Status:** Product-owner draft

## Owner Outcome

As a salon owner, I want a flexible service catalog so that online booking, staff assignment, pricing, billing, and inventory usage all follow the same service definitions.

## Actors

- Salon Owner
- Branch Manager
- Front Desk Staff
- Service Staff
- Customer

## Primary Screens

- Service catalog
- Service editor
- Category manager
- Branch pricing override
- Add-on/package configuration

## User Stories

### SVC-US-001: Define service

As a salon owner, I want to define service name, category, duration, price, tax, buffer, description, visibility, and eligible staff so that booking and billing are consistent.

### SVC-US-002: Branch-specific service settings

As a multi-branch owner, I want branch-level price, duration, staff, and availability overrides so that each location can operate correctly.

### SVC-US-003: Service add-ons

As front desk staff, I want recommended add-ons during booking and checkout so that upsell opportunities are not missed.

### SVC-US-004: Online booking visibility

As a salon owner, I want to control which services are bookable online so that complex services can remain staff-assisted.

## Functional Requirements

- Manage categories and subcategories.
- Define service duration, buffer, base price, tax category, staff skill requirement, resource requirement, and inventory consumption template.
- Set online booking visibility and customer-facing description.
- Configure add-ons, bundles, packages, and contraindication notes.
- Support branch-level override for price, duration, visibility, and staff eligibility.
- Track service active/inactive status without deleting historical references.

## Business Rules And Edge Cases

- Historical appointments and invoices must preserve service name/price at time of transaction.
- Inactive services must not appear in new bookings but must remain visible in history.
- A service requiring specialized staff must only show eligible staff in slot search.
- Complex services may require consultation before booking.
- Service duration changes should not mutate existing appointments.

## Acceptance Criteria

- Given a service is inactive, when staff creates a new booking, then the service is unavailable for selection.
- Given branch-specific pricing exists, when a booking is created for that branch, then the branch price is used.
- Given a service requires a colorist skill, when selecting staff, then only staff with that skill are shown.
- Given a service has inventory consumption configured, when checkout completes, then professional-use inventory consumption can be recorded.

## Non-Functional Requirements

- Service catalog changes must be audited.
- Catalog lookup must be fast enough for booking and POS screens.
- Public service data must not expose internal cost or margin data.

## HLD/LLD Hints

- Treat branch overrides as layered configuration over a salon-level service.
- Snapshot transactional service data into appointment/invoice line items.
- Keep inventory consumption rules connected but not embedded in service text fields.
