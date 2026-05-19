# Appointment Calendar Wireframes

## Purpose

Define the first visual implementation baseline for appointment calendar, appointment create/edit, and slot-conflict handling.

## Source Documents

- [Appointment FRD](../FRD/appointment.md)
- [Appointment HLD](../HLD/appointment.md)
- [Appointment LLD](../LLD/appointment.md)
- [Appointment Web LLD](../WEB/appointment.md)
- [Appointment Validation](../VALIDATION/appointment-validation.md)
- [Appointment Tests](../TEST/appointment.md)
- [API Endpoint Map](../API/endpoint-map.md#appointment)

## Penpot Boards

| Screen state            | Penpot board name                      | Penpot board ID                        | Purpose                                                             |
| ----------------------- | -------------------------------------- | -------------------------------------- | ------------------------------------------------------------------- |
| Calendar desktop        | `appointments.calendar.desktop`        | `c314af3e-8de0-80bd-8008-078a0c52b0f9` | Daily calendar with filters, appointment cards, and detail drawer.  |
| Create/edit desktop     | `appointments.create-edit.desktop`     | `c314af3e-8de0-80bd-8008-078a184c7d6e` | Appointment form with availability results and policy check panel.  |
| Conflict dialog desktop | `appointments.conflict-dialog.desktop` | `c314af3e-8de0-80bd-8008-078a209c1d71` | Slot conflict recovery with refresh and alternative-slot selection. |

## Screen Transitions

| From screen/state         | User action                 | Target screen/state                   | Backend interaction                                                                                                     |
| ------------------------- | --------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Calendar                  | Select `New appointment`    | Create/edit appointment               | None before screen load; form initializes with selected context.                                                        |
| Calendar                  | Select appointment card     | Detail drawer                         | `getAppointment` when detail data is not already loaded.                                                                |
| Detail drawer             | Select `Reschedule`         | Create/edit appointment in edit mode  | `getAppointment`, then `findAppointmentSlots`.                                                                          |
| Create/edit appointment   | Select `Check availability` | Availability results panel            | `findAppointmentSlots`.                                                                                                 |
| Create/edit appointment   | Select `Save appointment`   | Calendar or conflict dialog           | `createAppointment` or `rescheduleAppointment`.                                                                         |
| Save appointment conflict | Select `Refresh slots`      | Updated availability results          | `findAppointmentSlots` using current form values.                                                                       |
| Save appointment conflict | Select alternative slot     | Create/edit appointment with new slot | No write until user confirms save.                                                                                      |
| Detail drawer             | Select status action        | Updated drawer/calendar state         | `confirmAppointment`, `markAppointmentArrived`, `completeAppointment`, `cancelAppointment`, or `markAppointmentNoShow`. |

## Required States

The implementation must cover these visual states:

- loading calendar;
- empty day;
- appointment cards grouped by time;
- forbidden branch or business context;
- stale slot conflict;
- validation errors in create/edit form;
- policy violation;
- server error with correlation ID;
- successful create/reschedule returning to calendar.

## Draw.io Companion

The lifecycle and availability flow is modeled in:

- [Appointment Lifecycle Draw.io](../DIAGRAMS/drawio/appointment-lifecycle.drawio)
