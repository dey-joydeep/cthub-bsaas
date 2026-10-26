# Customer App Functional Requirements

**Date:** 2026-05-18
**Status:** Current planning baseline

## Owner Outcome

Customers must be able to discover salons, book services, manage appointments, view receipts, track benefits, and submit reviews without bypassing salon operational rules.

## Functional Requirements

| ID          | Requirement                                                                                                                   |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------- |
| CUST-FR-001 | Customer dashboard must show upcoming appointment, recent visits, rewards snapshot, and notification highlights.              |
| CUST-FR-002 | Booking must require salon/branch, service, date/time, and customer contact context.                                          |
| CUST-FR-003 | Booking must enforce branch hours, staff availability, service duration, service visibility, and cancellation/deposit policy. |
| CUST-FR-004 | Customers may reschedule or cancel only while branch policy allows it.                                                        |
| CUST-FR-005 | Appointment history must show completed, cancelled, no-show, and upcoming appointments.                                       |
| CUST-FR-006 | Favorites must support salons, branches, services, and staff where public visibility allows.                                  |
| CUST-FR-007 | Rewards view must show package balance, loyalty points, referral status, and expiry when enabled.                             |
| CUST-FR-008 | Receipts view must show invoices, payments, refunds, and dues visible to the customer.                                        |
| CUST-FR-009 | Reviews may be submitted only for eligible completed appointments.                                                            |

## Business Rules

| Rule ID     | Rule                                                                                                              |
| ----------- | ----------------------------------------------------------------------------------------------------------------- |
| CUST-BR-001 | Customer booking must use the same availability and service eligibility rules as salon owner appointment booking. |
| CUST-BR-002 | Shared phone numbers must not automatically merge customer identities.                                            |
| CUST-BR-003 | Marketing opt-out must not block transactional booking reminders.                                                 |
| CUST-BR-004 | Customer-visible price must match the branch/service configuration or be clearly marked as starting price.        |
| CUST-BR-005 | Review submission must be tied to an eligible completed visit.                                                    |

## Error Outcomes

| Case                                   | Required outcome                                                        |
| -------------------------------------- | ----------------------------------------------------------------------- |
| Slot taken during booking              | `409` with `customer_app.booking.error.slot_conflict`.                  |
| Cancellation blocked by policy         | `409` with `customer_app.appointment.error.cancellation_window_closed`. |
| Review not eligible                    | `403` or `409` with `customer_app.review.error.not_eligible`.           |
| Customer attempts cross-account access | `404` or `403` according to leakage risk.                               |
