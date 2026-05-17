# Appointment Validation

**Date:** 2026-05-12
**Status:** Implementation baseline

## Booking Form

| Property    | Value                                     |
| ----------- | ----------------------------------------- |
| Screen ID   | `appointments.booking`                    |
| Form ID     | `appointment.booking.create`              |
| Actors      | Owner, Branch Manager, Front Desk         |
| Context     | `tenantId`, `salonBusinessId`, `branchId` |
| Operation   | `createAppointment`                       |
| Idempotency | Required                                  |

| Field        | Control                 | Default         | Enabled when         | Client validation             | Backend validation               | Error key                                     |
| ------------ | ----------------------- | --------------- | -------------------- | ----------------------------- | -------------------------------- | --------------------------------------------- |
| `branchId`   | branch selector/context | selected branch | branch context valid | required branch in business   | branch active and actor can book | `error.appointment.booking.branch.invalid`    |
| `customerId` | customer autocomplete   | empty           | branch context valid | required customer in business | customer belongs to business     | `error.appointment.booking.customer.required` |
| `lines`      | service line editor     | one empty line  | customer selected    | at least one line             | at least one valid line          | `error.appointment.booking.lines.required`    |
| `notes`      | textarea                | empty           | form editable        | max 1000 chars                | max 1000 chars                   | `error.appointment.booking.notes.invalid`     |

Service line fields:

| Field       | Control                      | Default | Enabled when     | Client validation                 | Backend validation                                  | Error key                                  |
| ----------- | ---------------------------- | ------- | ---------------- | --------------------------------- | --------------------------------------------------- | ------------------------------------------ |
| `serviceId` | service autocomplete         | empty   | branch selected  | active service in business/branch | active service; branch override valid               | `error.appointment.line.service.invalid`   |
| `staffId`   | staff autocomplete           | empty   | service selected | staff from slot/eligibility list  | active branch staff; skill eligible unless override | `error.appointment.line.staff.invalid`     |
| `startsAt`  | date-time picker/slot picker | empty   | service selected | UTC ISO submit; slot selected     | branch hours, shift, leave, overlap, policy checks  | `error.appointment.line.starts_at.invalid` |

Cross-field rules:

- `startsAt` plus service duration/buffer determines line end.
- Multi-line services must not overlap for the same staff.
- Booking commit must re-check conflicts transactionally.

Conflict behavior:

- Staff overlap returns `409` with `error.appointment.booking.staff_conflict`.
- Outside hours/shift returns `409` with `error.appointment.booking.outside_hours`.
- Unauthorized override returns `403` with `error.appointment.override.forbidden`.

## Walk-In Form

| Property    | Value                                     |
| ----------- | ----------------------------------------- |
| Screen ID   | `appointments.walk_in`                    |
| Form ID     | `appointment.walk_in.create`              |
| Actors      | Owner, Branch Manager, Front Desk         |
| Context     | `tenantId`, `salonBusinessId`, `branchId` |
| Operation   | `createWalkInAppointment`                 |
| Idempotency | Required                                  |

Includes Booking Form fields plus:

| Field                  | Control      | Default | Enabled when          | Client validation | Backend validation | Error key                                |
| ---------------------- | ------------ | ------- | --------------------- | ----------------- | ------------------ | ---------------------------------------- |
| `estimatedWaitMinutes` | number input | empty   | walk-in queue enabled | integer >= 0      | integer >= 0       | `error.appointment.walk_in.wait.invalid` |

## Reschedule Form

| Property    | Value                                                      |
| ----------- | ---------------------------------------------------------- |
| Screen ID   | `appointments.reschedule`                                  |
| Form ID     | `appointment.reschedule`                                   |
| Actors      | Owner, Branch Manager, Front Desk                          |
| Context     | `tenantId`, `salonBusinessId`, `branchId`, `appointmentId` |
| Operation   | `rescheduleAppointment`                                    |
| Idempotency | Required                                                   |

| Field    | Control             | Default                   | Enabled when                   | Client validation       | Backend validation           | Error key                                      |
| -------- | ------------------- | ------------------------- | ------------------------------ | ----------------------- | ---------------------------- | ---------------------------------------------- |
| `lines`  | service line editor | current appointment lines | appointment can be rescheduled | at least one valid line | same booking conflict checks | `error.appointment.reschedule.lines.invalid`   |
| `reason` | textarea            | empty                     | actor can reschedule           | required; 1-240 chars   | required; audit persisted    | `error.appointment.reschedule.reason.required` |

## Cancel / No-Show Form

| Property   | Value                                                                                 |
| ---------- | ------------------------------------------------------------------------------------- |
| Screen ID  | `appointments.cancel_no_show`                                                         |
| Form ID    | `appointment.reason_action`                                                           |
| Actors     | Owner, Branch Manager, Front Desk, assigned Service Staff for no-show where permitted |
| Context    | `tenantId`, `salonBusinessId`, `branchId`, `appointmentId`                            |
| Operations | `cancelAppointment`, `markAppointmentNoShow`                                          |

| Field    | Control  | Default | Enabled when                        | Client validation     | Backend validation                            | Error key                                  |
| -------- | -------- | ------- | ----------------------------------- | --------------------- | --------------------------------------------- | ------------------------------------------ |
| `reason` | textarea | empty   | action permitted by status and role | required; 1-240 chars | required; transition allowed; audit persisted | `error.appointment.action.reason.required` |

Status transition validation:

- Unsupported transition returns `409` with `error.appointment.status.invalid_transition`.
- Completed appointments cannot be cancelled in MVP.

Test mapping:

- `VAL-APPT-001`: booking without customer fails.
- `VAL-APPT-002`: overlapping staff booking returns conflict.
- `VAL-APPT-003`: reschedule reason required.
- `VAL-APPT-004`: invalid transition returns conflict.
