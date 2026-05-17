# Appointment HLD

## Purpose

Appointment manages salon bookings, calendar availability, service/staff selection, lifecycle status, and conflict prevention.

## Architecture Scope

- Owns appointment lifecycle from draft or request through confirmation, check-in, completion, cancellation, and no-show.
- Computes availability from branch hours, holidays, service duration, staff skills, staff roster, and existing bookings.
- Produces appointment context for POS billing and customer history.

## Dependencies

- Branch Settings supplies hours and closure rules.
- Staff supplies roster and skill eligibility.
- Service Catalog supplies service duration and price snapshot.
- Customer CRM supplies customer identity and communication preferences.
- POS consumes completed or billable appointments.

## Data Ownership

- `Appointment` belongs to one business and one branch.
- Appointment lines hold service snapshots and assigned staff.
- Status history records actor, reason, timestamp, and correlation ID.

## Integration Points

- API operations are listed in [API endpoint map](../API/endpoint-map.md#appointment).
- Detailed commands and transactions are defined in [Appointment LLD](../LLD/appointment.md).
- Screen behavior is defined in [Appointment Web LLD](../WEB/appointment.md).
- Validation rules are defined in [Appointment Validation](../VALIDATION/appointment-validation.md).
- Wireframes are defined in [Appointment Calendar Wireframes](../WIREFRAMES/appointment-calendar.md).

## Events

- `AppointmentCreated`
- `AppointmentConfirmed`
- `AppointmentRescheduled`
- `AppointmentCancelled`
- `AppointmentCheckedIn`
- `AppointmentCompleted`
- `AppointmentMarkedNoShow`

## Security And Consistency

- Booking writes run inside a transaction with conflict detection at the branch/staff/time-slot level.
- Server validation rejects unavailable slots even when the client shows stale availability.
- Cancellation and reschedule policies are evaluated against branch-local time.
