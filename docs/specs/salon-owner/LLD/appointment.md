# Appointment LLD

## Backend Components

Visual flow reference:

- [Appointment Lifecycle Draw.io](../../../diagrams/salon-owner/drawio/appointment-lifecycle.drawio)

- `AppointmentController`
- `AppointmentService`
- `AvailabilityService`
- `AppointmentRepositoryPort`
- `BranchSchedulePort`
- `StaffAvailabilityPort`
- `ServiceSnapshotPort`

## Commands And Queries

- `SearchAvailabilityQuery`
- `ListAppointmentsQuery`
- `CreateAppointmentCommand`
- `ConfirmAppointmentCommand`
- `RescheduleAppointmentCommand`
- `CancelAppointmentCommand`
- `CheckInAppointmentCommand`
- `CompleteAppointmentCommand`
- `MarkNoShowCommand`

## Transaction Rules

- Appointment creation and reschedule run conflict detection inside the write transaction.
- Status changes append status history and update the current status atomically.
- Completion can mark the appointment billable for POS in the same transaction.

## Validation Mapping

- DTO validation maps to [Appointment Validation](../VALIDATION/appointment-validation.md).
- Service validation verifies branch hours, holiday closure, staff skill, staff roster, customer scope, cancellation policy, and slot conflict.

## Error Mapping

- `APPOINTMENT_NOT_FOUND` returns `404`.
- `APPOINTMENT_SLOT_UNAVAILABLE` returns `409`.
- `APPOINTMENT_STATUS_TRANSITION_INVALID` returns `409`.
- `APPOINTMENT_POLICY_VIOLATION` returns `409`.
- `APPOINTMENT_VALIDATION_FAILED` returns `400`.

## Implementation Notes

- All appointment time inputs are API ISO strings and are evaluated in branch-local policy context.
- Server computes end time from service duration and selected start time.
- Availability responses include a version or generated-at timestamp for stale-client handling.
