# Appointment Test Spec

## Backend Unit Tests

- Availability calculation covers branch hours, holidays, service duration, staff skill, roster, and existing bookings.
- Lifecycle transition rules reject invalid status moves.
- Cancellation policy uses branch-local time.

## Backend Integration Tests

- Create appointment reserves available slot.
- Concurrent booking attempts for same staff and slot produce one success and one conflict.
- Reschedule revalidates availability.
- Completion marks appointment billable for POS.

## Web Tests

- Calendar filters by branch, staff, date range, and status.
- Conflict dialog refreshes availability.
- Status actions disable invalid transitions with reason.

## Contract Tests

- Availability response includes generated timestamp or version.
- Appointment errors use stable conflict and policy keys.
