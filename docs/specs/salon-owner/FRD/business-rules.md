# Salon Owner Business Rules

**Date:** 2026-05-11
**Status:** Implementation baseline

## Purpose

Define binding business behavior for the Salon Owner MVP. HLD, LLD, OpenAPI, database schema, and tests must implement these rules.

## Cross-Cutting Rules

| Rule ID | Rule                                                                                                                                                |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| BR-X-01 | Every mutation must be authorized by tenant, salon business, branch where applicable, role, and operation.                                          |
| BR-X-02 | Every mutation that changes settings, permissions, appointments, invoices, payments, stock, or sensitive customer data must create an audit record. |
| BR-X-03 | Historical appointment, invoice, payment, and stock records must not be silently mutated by later catalog, branch, policy, or tax changes.          |
| BR-X-04 | All money values must be calculated server-side and persisted with deterministic scale.                                                             |
| BR-X-05 | All externally visible timestamps must be UTC ISO-8601 strings.                                                                                     |
| BR-X-06 | Business-day filtering must use the selected branch timezone.                                                                                       |
| BR-X-07 | A resource outside caller scope must return `404` when revealing its existence would leak tenant data.                                              |
| BR-X-08 | A valid in-scope resource with insufficient permission must return `403`.                                                                           |

## Salon Business And Branch Rules

| Rule ID  | Rule                                                                                                                                  |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| BR-BR-01 | A salon business must have at least one owner.                                                                                        |
| BR-BR-02 | A branch must belong to exactly one salon business.                                                                                   |
| BR-BR-03 | A branch must have name, address, timezone, currency, and active/inactive status.                                                     |
| BR-BR-04 | An inactive branch must not accept new appointments, walk-ins, invoices, or stock movements except corrective/admin operations.       |
| BR-BR-05 | Existing appointments must not be deleted or silently changed when branch hours, holidays, or policies change.                        |
| BR-BR-06 | Branch holiday/special-day rules override weekly business hours for slot search.                                                      |
| BR-BR-07 | Branch policy changes apply only to new operations after the saved timestamp unless a manager explicitly reapplies policy with audit. |
| BR-BR-08 | Tax and invoice numbering changes apply only to invoices finalized after the change.                                                  |

## Staff Rules

| Rule ID  | Rule                                                                                                                                                      |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BR-ST-01 | Staff profile must belong to one salon business.                                                                                                          |
| BR-ST-02 | Staff can be assigned to one or more branches within the same salon business.                                                                             |
| BR-ST-03 | Staff must have an active branch assignment to appear in booking slot search for that branch.                                                             |
| BR-ST-04 | Deactivated staff must not authenticate or be assigned to new appointments.                                                                               |
| BR-ST-05 | Historical appointments and invoices must retain staff display snapshot after staff deactivation or rename.                                               |
| BR-ST-06 | Staff leave and blocked time must make the staff unavailable for overlapping appointment lines.                                                           |
| BR-ST-07 | Staff role changes must be audited with old roles and new roles.                                                                                          |
| BR-ST-08 | Staff with insufficient skill must not be assigned to a service unless an owner/manager override is recorded.                                             |
| BR-ST-09 | Staff self-service leave requests are outside the MVP unless promoted into the staff FRD with approval states, actor permissions, and notification rules. |

## Service Catalog Rules

| Rule ID   | Rule                                                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| BR-SVC-01 | Service category and service definitions belong to one salon business.                                                                      |
| BR-SVC-02 | Service duration must be greater than zero.                                                                                                 |
| BR-SVC-03 | Service base price must be zero or greater.                                                                                                 |
| BR-SVC-04 | Inactive services must not be selectable for new bookings or invoice lines.                                                                 |
| BR-SVC-05 | Existing appointment and invoice snapshots must keep the service name, duration, price, and tax context used at creation/finalization time. |
| BR-SVC-06 | Branch service overrides must override salon business defaults for that branch only.                                                        |
| BR-SVC-07 | Staff eligibility must be enforced during slot search and booking commit.                                                                   |
| BR-SVC-08 | Service duration changes must not mutate existing appointment line durations.                                                               |

## Customer CRM Rules

| Rule ID   | Rule                                                                                                                            |
| --------- | ------------------------------------------------------------------------------------------------------------------------------- |
| BR-CRM-01 | Customer profile belongs to one salon business and can have visits across branches of that business.                            |
| BR-CRM-02 | Customer can exist without an application login identity.                                                                       |
| BR-CRM-03 | Phone and email duplicate detection must warn users but must not auto-merge records.                                            |
| BR-CRM-04 | Restricted notes must be visible only to authorized roles.                                                                      |
| BR-CRM-05 | Marketing communication must respect channel-level opt-out.                                                                     |
| BR-CRM-06 | Transactional reminders can be sent when legally allowed even if marketing opt-out is enabled.                                  |
| BR-CRM-07 | Customer merge must require owner/manager permission and must audit source customer, target customer, actor, and moved records. |
| BR-CRM-08 | Customer deletion/anonymization must preserve invoices, audit records, and legally required financial history.                  |

## Appointment And Walk-In Rules

| Rule ID    | Rule                                                                                                                                                                        |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BR-APPT-01 | Appointment must belong to one salon business, one branch, and one customer profile.                                                                                        |
| BR-APPT-02 | Appointment must contain at least one appointment line.                                                                                                                     |
| BR-APPT-03 | Appointment line must snapshot service name, duration, price estimate, assigned staff display name, and configured buffer.                                                  |
| BR-APPT-04 | Slot search must consider branch hours, holidays, service duration, buffer, staff branch assignment, staff shift, staff leave, staff skill, and existing appointment lines. |
| BR-APPT-05 | Booking commit must re-check conflicts inside the database transaction.                                                                                                     |
| BR-APPT-06 | Overlapping staff appointment lines must return `409` unless an authorized override is submitted with reason.                                                               |
| BR-APPT-07 | Booking outside branch hours or staff shift must return `409` unless an authorized override is submitted with reason.                                                       |
| BR-APPT-08 | Reschedule must preserve original appointment audit history.                                                                                                                |
| BR-APPT-09 | Cancel and no-show must require a reason.                                                                                                                                   |
| BR-APPT-10 | Completed appointment must be eligible for checkout.                                                                                                                        |
| BR-APPT-11 | Cancelled and no-show appointments must not create service revenue unless branch policy creates a penalty invoice.                                                          |
| BR-APPT-12 | Walk-in must be assigned to branch and customer before service starts.                                                                                                      |
| BR-APPT-13 | Appointment status changes, reschedules, cancellations, and no-show actions must create audit records and notification intents.                                             |

## Appointment State Machine

| From         | To           | Required condition                        |
| ------------ | ------------ | ----------------------------------------- |
| `DRAFT`      | `BOOKED`     | Slot commit succeeds.                     |
| `BOOKED`     | `CONFIRMED`  | Confirmation recorded.                    |
| `BOOKED`     | `ARRIVED`    | Customer arrives before service starts.   |
| `CONFIRMED`  | `ARRIVED`    | Customer arrives before service starts.   |
| `ARRIVED`    | `IN_SERVICE` | Assigned staff starts service.            |
| `IN_SERVICE` | `COMPLETED`  | Service completion is recorded.           |
| `BOOKED`     | `CANCELLED`  | Cancellation reason recorded.             |
| `CONFIRMED`  | `CANCELLED`  | Cancellation reason recorded.             |
| `ARRIVED`    | `CANCELLED`  | Manager/front desk cancellation recorded. |
| `BOOKED`     | `NO_SHOW`    | No-show reason or policy code recorded.   |
| `CONFIRMED`  | `NO_SHOW`    | No-show reason or policy code recorded.   |

Any transition outside this table must return `409`.

## Billing/POS Rules

| Rule ID   | Rule                                                                                                                 |
| --------- | -------------------------------------------------------------------------------------------------------------------- |
| BR-POS-01 | Invoice must belong to one salon business, one branch, and one customer.                                             |
| BR-POS-02 | Invoice lines must snapshot item name, quantity, unit price, discount, tax, and source reference.                    |
| BR-POS-03 | Invoice totals must be calculated server-side from persisted invoice lines.                                          |
| BR-POS-04 | Finalized invoice lines and totals must be immutable.                                                                |
| BR-POS-05 | Payment capture must not exceed outstanding due unless overpayment policy exists and the actor has permission.       |
| BR-POS-06 | Partial payment must create or retain pending due.                                                                   |
| BR-POS-07 | Fully paid invoice must have due amount equal to zero.                                                               |
| BR-POS-08 | Invoice finalization and payment capture must be idempotent when a valid idempotency key is supplied.                |
| BR-POS-09 | Refund, void after finalization, credit note, and daily closing are outside MVP unless separately pulled into scope. |
| BR-POS-10 | GST/tax fields must be snapshotted when invoice is finalized.                                                        |

## Invoice State Machine

| From             | To               | Required condition                                              |
| ---------------- | ---------------- | --------------------------------------------------------------- |
| `DRAFT`          | `FINALIZED`      | Server totals are valid and no payment is captured.             |
| `FINALIZED`      | `PARTIALLY_PAID` | Payment total is greater than zero and less than invoice total. |
| `FINALIZED`      | `PAID`           | Payment total equals invoice total.                             |
| `PARTIALLY_PAID` | `PAID`           | Cumulative payment equals invoice total.                        |
| `DRAFT`          | `VOID`           | Draft is discarded before finalization.                         |

Any transition outside this table must return `409`.

## Inventory Rules

| Rule ID   | Rule                                                                                                  |
| --------- | ----------------------------------------------------------------------------------------------------- |
| BR-INV-01 | Product belongs to one salon business.                                                                |
| BR-INV-02 | Branch stock belongs to one product and one branch.                                                   |
| BR-INV-03 | Stock movement ledger is the authoritative source for inventory changes.                              |
| BR-INV-04 | Branch stock quantity must be updated in the same transaction as stock movement creation.             |
| BR-INV-05 | Negative stock must return `409` unless branch policy allows negative stock and actor has permission. |
| BR-INV-06 | Low-stock alert must trigger when branch quantity is less than or equal to branch/product threshold.  |
| BR-INV-07 | Stock adjustment must require reason and audit.                                                       |
| BR-INV-08 | Retail sale stock deduction is allowed only from finalized paid or payable invoice flow.              |

## Dashboard Rules

| Rule ID    | Rule                                                                  |
| ---------- | --------------------------------------------------------------------- |
| BR-DASH-01 | Dashboard must respect the caller's business and branch access.       |
| BR-DASH-02 | Financial metrics must use finalized invoices and captured payments.  |
| BR-DASH-03 | Appointment metrics must use branch-local business day.               |
| BR-DASH-04 | Pending dues must include invoices with due amount greater than zero. |
| BR-DASH-05 | Low-stock count must use active products and current branch stock.    |
