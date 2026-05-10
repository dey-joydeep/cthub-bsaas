# Appointment And Walk-In User Stories

**Date:** 2026-05-11
**Status:** Product-owner draft

## Owner Outcome

As a salon owner, I want bookings and walk-ins managed from one operational board so that staff time is used well and customers are served without confusion.

## Actors

- Salon Owner
- Branch Manager
- Front Desk Staff
- Service Staff
- Customer

## Primary Screens

- Calendar/day board
- Booking form
- Walk-in queue
- Appointment detail drawer
- Reschedule/cancel dialog
- Staff schedule view

## User Stories

### APPT-US-001: Book appointment

As front desk staff, I want to create a booking with customer, services, staff, branch, date, time, notes, and estimated price so that the customer's visit is reserved correctly.

### APPT-US-002: Manage walk-in queue

As front desk staff, I want to add walk-in customers to a queue and assign staff when available so that walk-ins do not disrupt scheduled appointments.

### APPT-US-003: Avoid staff conflicts

As a branch manager, I want the system to prevent double-booking staff and resources so that customers are not promised impossible slots.

### APPT-US-004: Reschedule, cancel, and no-show

As front desk staff, I want to reschedule, cancel, or mark no-show with reason and policy impact so that operational history and billing remain accurate.

### APPT-US-005: Service progress tracking

As service staff, I want to mark a visit as arrived, in service, completed, or delayed so that front desk and owner know the real status.

## Functional Requirements

- Create booking for existing or new customer.
- Support single service, multiple services, add-ons, package redemption, and preferred staff.
- Show available slots based on staff working hours, service duration, buffer time, holidays, and existing bookings.
- Allow owner/manager override with reason and audit trail.
- Support appointment statuses: draft, booked, confirmed, arrived, in service, completed, cancelled, no-show.
- Support waitlist/walk-in queue with priority and expected wait time.
- Capture customer notes, allergies, preferences, and internal-only staff notes.
- Send configurable confirmation and reminder notifications.

## Business Rules And Edge Cases

- Staff cannot be booked outside working hours unless an authorized override is recorded.
- Service duration must include configured buffer time.
- If one appointment has multiple services, the system must support same-staff or different-staff sequencing.
- Cancellation policy may charge a fee or release deposit depending on branch settings.
- No-show should not create service revenue but may create a penalty invoice if configured.
- Customer notes with health or allergy information must be visible only to authorized staff.
- Walk-ins must be convertible to full customer records later.

## Acceptance Criteria

- Given a service requires 60 minutes and 10 minutes buffer, when I select a staff member, then only compatible slots are shown.
- Given a staff member is already booked, when I try to book an overlapping slot, then the system blocks it unless I have override permission.
- Given a walk-in is added, when staff becomes available, then I can assign the walk-in and move status to in service.
- Given a customer cancels inside the penalty window, when I cancel the appointment, then the configured fee/deposit rule is applied.
- Given a completed appointment, when I open checkout, then selected services, add-ons, package usage, staff, discounts, and tax context are carried forward.

## Non-Functional Requirements

- Calendar interactions must remain responsive for a busy branch day.
- Conflict checks must be transactionally safe under concurrent booking attempts.
- Every override, cancellation, and no-show must be auditable.
- Notification sending must not block booking creation.

## HLD/LLD Hints

- Model appointment lifecycle as explicit state transitions.
- Separate slot search from booking commit.
- Define concurrency handling for final booking creation.
