# Salon Owner MVP Test Strategy

**Date:** 2026-05-11
**Status:** Implementation baseline

## Purpose

Define test coverage needed before implementation can be considered production-ready.

## Test Layers

| Layer              | Purpose                                                                 |
| ------------------ | ----------------------------------------------------------------------- |
| Unit tests         | Domain rules, service methods, validation, state transitions.           |
| Integration tests  | Feature modules with real DB where persistence and transactions matter. |
| API contract tests | Validate controller responses against the OpenAPI contract.             |
| Web unit tests     | Component/service state, guards, form validation.                       |
| E2E smoke          | Critical happy paths after real e2e setup exists.                       |
| NFR/security tests | Tenant isolation, authorization, audit, concurrency.                    |

## Backend Unit Tests

Required coverage areas:

- Validation rules from [Validation Index](../VALIDATION/README.md).
- Appointment status transition matrix.
- Slot overlap detection.
- Branch hours/holiday validation.
- Service active/inactive and staff eligibility rules.
- Invoice total calculation and payment state transitions.
- Stock movement quantity updates.
- Customer note permission logic.
- Dashboard read-model aggregation mapping.

## Backend Integration Tests

Use repo integration test conventions for server feature libs.

Required scenarios:

- Create branch -> staff -> service -> customer -> appointment.
- Double-booking prevention under overlapping appointment lines.
- Appointment completion -> checkout context -> invoice finalize -> payment capture.
- Partial payment creates pending due.
- Stock adjustment updates movement ledger and branch stock.
- Tenant/branch access denial.
- Audit log creation for high-risk mutations.

## Concurrency Tests

Minimum:

- Two requests attempt same staff/time booking; one succeeds, one conflicts.
- Two stock adjustments on same product/branch preserve correct final quantity.
- Payment capture cannot overpay invoice under concurrent attempts.

## Web Tests

Minimum:

- Form/control validation behavior from [Validation Index](../VALIDATION/README.md).
- Booking form validates required customer/service/staff/date inputs.
- Calendar/day board renders status and role-permitted actions.
- POS checkout totals are displayed from server-calculated context.
- Restricted actions are hidden/disabled by role.
- Dialog focus management works for key modals.

## E2E Smoke Candidates

Real e2e is not part of this spec implementation, but the future smoke path must cover:

1. Owner signs in.
2. Creates branch/staff/service/customer.
3. Creates appointment.
4. Marks appointment completed.
5. Finalizes invoice.
6. Captures payment.
7. Dashboard reflects revenue and appointment status.

## Coverage Expectations

- Feature libs must maintain repo backend coverage standards.
- Financial and scheduling rules require branch/path coverage, not only line coverage.
- No `istanbul ignore` markers for business logic.

## Test Data Requirements

- Unique salon business/branch/customer/staff/service per integration test.
- Cleanup after each test.
- No shared mutable customer/staff records across parallel tests.
- Deterministic dates/times using fixed test clock where practical.
