# Staff Wireframes

## Purpose

Define the visual baseline for staff directory, profile editing, role/branch/skill assignment, schedule editing, and roster conflict recovery.

## Source Documents

- [Staff FRD](../FRD/staff.md)
- [Staff HLD](../HLD/staff.md)
- [Staff LLD](../LLD/staff.md)
- [Staff Web LLD](../WEB/staff.md)
- [Staff Validation](../VALIDATION/staff-validation.md)
- [Staff Tests](../TEST/staff.md)
- [API Endpoint Map](../API/endpoint-map.md#staff)
- [Staff Roster Conflict Draw.io](../DIAGRAMS/drawio/staff-roster-conflict-flow.drawio)

## Target Penpot Boards

| Screen state      | Board name                        | Purpose                                              |
| ----------------- | --------------------------------- | ---------------------------------------------------- |
| Directory         | `staff.directory.desktop`         | Staff list with branch, role, status, skill filters. |
| Profile edit      | `staff.profile.desktop`           | Edit profile, role, branch assignment, and skills.   |
| Schedule conflict | `staff.schedule-conflict.desktop` | Show future appointment blockers and resolution.     |

## Verified Penpot Board IDs

- `staff.directory.desktop`: `a7a9ed20-bb04-8098-8008-08d7efd3032f`
- `staff.profile.desktop`: `a7a9ed20-bb04-8098-8008-08d7ff8ac100`
- `staff.schedule-conflict.desktop`: `a7a9ed20-bb04-8098-8008-08d8155e3c2c`

## Screen Transitions

| From state      | User action               | Target state                                    | Backend interaction                                     |
| --------------- | ------------------------- | ----------------------------------------------- | ------------------------------------------------------- |
| Directory       | Select staff              | Profile edit                                    | `getStaff`                                              |
| Directory       | Create staff              | Profile edit                                    | `createStaff`                                           |
| Profile edit    | Save role/branches/skills | Profile or conflict                             | `replaceStaffRoles`, `replaceStaffSkills`, update staff |
| Profile edit    | Expand Personal Details   | Personal details subform loaded                 | `getStaffPersonalDetails`                               |
| Profile edit    | Save Personal & HR Info   | Personal details saved banner                   | `updateStaffPersonalDetails`                            |
| Profile edit    | Upload ID Document        | Document pending verification chip              | `uploadStaffIdentityDocument`                           |
| Self Profile    | Update contact/address    | Contact saved banner & manager notify           | `selfUpdateStaffContact`                                |
| Schedule edit   | Save schedule             | Profile or conflict dialog                      | `replaceStaffShifts`                                    |
| Conflict dialog | Resolve appointments      | Appointment calendar filtered to affected staff | appointment search query                                |

## Required States

- empty staff list;
- invitation pending;
- duplicate email;
- branch scope forbidden;
- schedule conflict;
- personal HR details collapsed vs expanded;
- document upload pending, verified, and rejected status chips;
- staff self-service view with locked legal fields and editable contact fields;
- archived staff readonly history;
- server error with correlation ID.
