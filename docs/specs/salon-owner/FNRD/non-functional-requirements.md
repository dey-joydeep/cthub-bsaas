# Salon Owner Non-Functional Requirements

**Date:** 2026-05-11
**Status:** Implementation baseline

## Purpose

Define non-functional requirements that must be reflected in implementation, testing, and deployment planning for the Salon Owner MVP.

## Security

| Requirement ID | Requirement                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------- |
| NFR-SEC-01     | All endpoints must require authentication unless explicitly documented as public.                                         |
| NFR-SEC-02     | Server-side authorization must enforce tenant, salon business, branch, role, and operation scope.                         |
| NFR-SEC-03     | Browser write endpoints must use platform CSRF protection.                                                                |
| NFR-SEC-04     | Error responses must include correlation ID and must not leak cross-tenant resource existence.                            |
| NFR-SEC-05     | Sensitive customer notes, tax settings, payment settings, permission changes, and financial changes must be audit logged. |
| NFR-SEC-06     | PII must be transmitted only over TLS in deployed environments.                                                           |

## Data Integrity

| Requirement ID | Requirement                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------------- |
| NFR-DATA-01    | Appointment booking and rescheduling must be transactionally safe against double booking.            |
| NFR-DATA-02    | Invoice finalization and payment capture must be transactionally consistent.                         |
| NFR-DATA-03    | Stock movement and branch stock update must occur in the same transaction.                           |
| NFR-DATA-04    | Financial records must be immutable after finalization except through explicit correction workflows. |
| NFR-DATA-05    | Historical records must snapshot mutable reference data used at transaction time.                    |

## Performance

| Requirement ID | Requirement                                                                                                                                                                                                                                                                                                                |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-PERF-01    | Front-desk search and booking screens must return common query results within interactive latency for a busy branch.                                                                                                                                                                                                       |
| NFR-PERF-02    | Dashboard queries must use read models or optimized queries and must not own write transactions.                                                                                                                                                                                                                           |
| NFR-PERF-03    | Slot search must be indexed by branch, staff, date/time, and appointment status.                                                                                                                                                                                                                                           |
| NFR-PERF-04    | Customer, service, staff, and product list endpoints must support pagination.                                                                                                                                                                                                                                              |
| NFR-PERF-05    | Common branch-scoped reads must be measured at p50, p95, and p99 with a stated fixture size and concurrent load. The provisional interactive budget is p95 at or below 500 ms and p99 at or below 1 s for 20 concurrent clients with representative busy-branch data; PO and QA confirm the final workload before release. |
| NFR-PERF-06    | Backend capacity evidence must record throughput, error rate, event-loop delay, and utilization. CPU-heavy jobs must not degrade the interactive request budget; use a worker or queue when representative measurement exceeds it.                                                                                         |

## Reliability

| Requirement ID | Requirement                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------ |
| NFR-REL-01     | Payment capture, invoice finalization, appointment creation, and stock adjustment must support idempotency.  |
| NFR-REL-02     | Notification failures must not roll back successful appointment or invoice transactions.                     |
| NFR-REL-03     | Audit writes for high-risk mutations must be part of the same transaction when feasible.                     |
| NFR-REL-04     | Repeated requests with the same idempotency key must return the original result or a deterministic conflict. |

## Observability

| Requirement ID | Requirement                                                                                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-OBS-01     | API responses must include correlation ID in metadata.                                                                                                                                |
| NFR-OBS-02     | Logs for mutations must include tenant, salon business, branch where applicable, actor, action, and correlation ID.                                                                   |
| NFR-OBS-03     | Domain events must be serializable and traceable by correlation ID.                                                                                                                   |
| NFR-OBS-04     | Release evidence must include the measured API latency and error profile, database workload, and event-loop health for critical paths; alert thresholds follow the accepted baseline. |

The budgets in NFR-PERF-05 are provisional product targets, not a claim that the current implementation meets them. See [Backend Reliability Evidence](../../../aidd/backend-reliability-evidence.md) for test profile, measurement method, and ownership. Booking, payment, and stock flows require real database concurrency proof when implemented.

## Accessibility And SSR

| Requirement ID | Requirement                                                                               |
| -------------- | ----------------------------------------------------------------------------------------- |
| NFR-WEB-01     | Partner web screens must remain SSR-safe.                                                 |
| NFR-WEB-02     | Interactive controls must be keyboard accessible.                                         |
| NFR-WEB-03     | Dialogs and drawers must manage focus correctly.                                          |
| NFR-WEB-04     | Role-restricted actions must not be exposed as executable controls to unauthorized users. |
