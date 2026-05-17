# Staff LLD

## Backend Components

Visual flow reference:

- [Staff Roster Conflict Draw.io](../../../diagrams/salon-owner/drawio/staff-roster-conflict-flow.drawio)

- `StaffController`
- `StaffService`
- `StaffRepositoryPort`
- `StaffScheduleRepositoryPort`
- `StaffInvitationPort`
- `AppointmentConflictPort`

## Commands And Queries

- `ListStaffQuery`
- `CreateStaffMemberCommand`
- `UpdateStaffProfileCommand`
- `UpdateStaffRolesCommand`
- `UpdateStaffBranchAssignmentsCommand`
- `UpdateStaffSkillsCommand`
- `UpdateStaffScheduleCommand`
- `ArchiveStaffMemberCommand`

## Transaction Rules

- Profile, role, branch assignment, and skill writes create audit entries.
- Role updates and invitation state changes are committed together when login access is granted.
- Schedule updates check future confirmed appointments before commit.

## Validation Mapping

- DTO validation maps to [Staff Validation](../VALIDATION/staff-validation.md).
- Service validation verifies email uniqueness within business, branch scope, role permission, service skill scope, and schedule conflicts.

## Error Mapping

- `STAFF_NOT_FOUND` returns `404`.
- `STAFF_EMAIL_DUPLICATE` returns `409`.
- `STAFF_BRANCH_SCOPE_INVALID` returns `403`.
- `STAFF_SCHEDULE_CONFLICT` returns `409`.
- `STAFF_VALIDATION_FAILED` returns `400`.

## Implementation Notes

- Staff profile creation does not create application login by default.
- Login invitation creates a pending auth link and never stores temporary passwords.
- Staff archive preserves historical appointment and invoice attribution.
