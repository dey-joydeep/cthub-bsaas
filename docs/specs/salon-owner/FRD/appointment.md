# Appointment FRD

**Date:** 2026-05-12
**Status:** Implementation baseline

## Purpose

Define booking, walk-in, slot search, reschedule, cancel, no-show, and appointment status requirements.

## Scope

| Capability                | Requirement                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------- |
| Slot search               | Show valid slots based on branch, staff, services, shifts, leave, hours, holidays, and conflicts. |
| Booking                   | Create appointment with customer, branch, one or more service lines, staff, and time.             |
| Walk-in                   | Create branch/customer visit without pre-booked slot and manage queue/service assignment.         |
| Reschedule/cancel/no-show | Change appointment state with reason and audit.                                                   |
| Status actions            | Track arrived, in service, completed, and related transitions.                                    |
| Query and filtering       | List appointments by authorized branch, customer, status, staff, and business-date filters.       |

## Actors

- Owner
- Branch Manager
- Front Desk
- Service Staff, assigned status actions

## Business Rules

- Appointment belongs to one salon business, one branch, and one customer profile.
- Appointment must contain at least one appointment line.
- Appointment line snapshots service, duration, estimate, staff display name, and buffer.
- Booking commit must re-check conflicts in the database transaction.
- Overlapping staff appointment lines return `409` unless authorized override is recorded.
- Cancel and no-show require a reason.
- Every status change, reschedule, cancellation, and no-show action must preserve audit history.
- Confirmation, reschedule, cancellation, and no-show actions must emit a notification intent; channel delivery policy is owned by the Notifications specs.
- Completed appointment is eligible for checkout.

## Implementation References

- HLD: [Appointment HLD](../HLD/appointment.md)
- LLD: [Appointment LLD](../LLD/appointment.md)
- Web: [Appointment Web](../WEB/appointment.md)
- Validation: [Appointment Validation](../VALIDATION/appointment-validation.md)
