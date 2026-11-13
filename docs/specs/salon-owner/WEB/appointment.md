# Appointment Web LLD

## Route And Screen

- Route: `/business/appointments`
- Primary screens: calendar, availability search, appointment create/edit, appointment detail, status actions.
- Wireframes: [Appointment Calendar Wireframes](../WIREFRAMES/appointment-calendar.md).

## User Goals

- Staff books appointments from available slots.
- Manager reschedules or cancels appointments with policy-aware feedback.
- Reception marks arrival, completion, no-show, and billing readiness.

## Components

- `AppointmentCalendarPage`
- `AvailabilitySearchPanel`
- `AppointmentForm`
- `AppointmentDetailDrawer`
- `AppointmentStatusActions`
- `AppointmentConflictDialog`

## State And Data

- Calendar state is branch, staff, date range, and status filtered.
- Availability search uses branch, services, staff preference, and date.
- Create and reschedule submit the selected slot version or generated-at timestamp.

## Controls And Validation

- Exact control behavior is defined in [Appointment Validation](../VALIDATION/appointment-validation.md).
- Staff selector is filtered by selected service skill and branch assignment.
- Reschedule form revalidates availability before submit.

## Error Handling

- Slot conflict returns a conflict dialog with refreshed availability action.
- Policy violation shows the policy reason and allowed alternatives.
- Status transition errors refresh appointment detail.

## Accessibility

- Calendar has list alternative for keyboard and screen-reader users.
- Status buttons expose current status, next action, and disabled reason.
