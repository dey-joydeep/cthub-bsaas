# Appointment API Requirements

## Functional Requirements

- Users can create, view, update, and delete (cancel) appointments for salons.
- Appointments must include:
  - salonId
  - userId
  - serviceId(s)
  - status (e.g., BOOKED, CONFIRMED, COMPLETED, CANCELLED)
  - startTime (ISO 8601)
  - endTime (ISO 8601)
  - notes (optional)
  - cancellationReason (optional)
- The system must validate:
  - User and salon exist
  - Service(s) exist and belong to the salon
  - Appointment time is valid (not in the past, within business hours, not overlapping for user/salon)
- Only users with COMPLETED appointments are eligible to review the salon.
- Endpoints must support:
  - Creating an appointment
  - Viewing appointments (by user, by salon, by status, etc.)
  - Updating appointment status
  - Rescheduling appointments
  - Canceling appointments with optional reason
- All appointment logic must use PostgreSQL (no in-memory/demo data).

## API Parameters

### Create Appointment

| Parameter  | Type     | Required | Description                           |
| ---------- | -------- | -------- | ------------------------------------- |
| salonId    | string   | Yes      | ID of the salon                       |
| userId     | string   | Yes      | ID of the user making the appointment |
| serviceIds | string[] | Yes      | IDs of services being booked          |
| startTime  | string   | Yes      | Appointment start time (ISO 8601)     |
| endTime    | string   | Yes      | Appointment end time (ISO 8601)       |
| notes      | string   | No       | Additional notes for the appointment  |

### Update Appointment Status

| Parameter   | Type   | Required | Description                                          |
| ----------- | ------ | -------- | ---------------------------------------------------- |
| status      | string | Yes      | New status (BOOKED, CONFIRMED, COMPLETED, CANCELLED) |
| reason      | string | No       | Required when status is CANCELLED                    |
| notes       | string | No       | Additional notes about the status change             |

### Reschedule Appointment

| Parameter  | Type   | Required | Description                           |
| ---------- | ------ | -------- | ------------------------------------- |
| startTime  | string | Yes      | New start time (ISO 8601)             |
| endTime    | string | Yes      | New end time (ISO 8601)               |
| reason     | string | No       | Reason for rescheduling               |

## Notes

- All appointment logic must use production databases (PostgreSQL).
- Interfaces must be in the `models` folder, one per file.
- Demo data is only allowed in tests/mocks.
- The system should maintain an audit log of all status changes for each appointment.
- Email/SMS notifications should be sent for important status changes (confirmation, cancellation, rescheduling).
