# Staff LLD

## Backend Components

Visual flow reference:

- [Staff Roster Conflict Draw.io](../DIAGRAMS/drawio/staff-roster-conflict-flow.drawio)

- `StaffController`
- `StaffService`
- `StaffRepositoryPort`
- `StaffScheduleRepositoryPort`
- `StaffInvitationPort`
- `AppointmentConflictPort`
- `RoleManagementController`
- `RoleService`
- `BusinessRoleRepositoryPort`
- `PermissionRepositoryPort`

## Commands And Queries

- `ListStaffQuery`
- `CreateStaffMemberCommand`
- `UpdateStaffProfileCommand`
- `UpdateStaffRolesCommand`
- `UpdateStaffBranchAssignmentsCommand`
- `UpdateStaffSkillsCommand`
- `UpdateStaffScheduleCommand`
- `ArchiveStaffMemberCommand`
- `ListBusinessRolesQuery`
- `CreateBusinessRoleCommand`
- `UpdateBusinessRoleCommand`
- `DeleteBusinessRoleCommand`
- `ListSystemPermissionsQuery`

## Persistence Models (ADR-0005)

- `PermissionMaster`: System capability definitions (`code`, `name`, `description`, `category`).
- `RoleMaster`: Global preset templates (`code`, `defaultName`, `description`, `isSystemRole`).
- `RoleMasterPermission`: Join table linking default presets to capability codes.
- `BusinessRole`: Salon business-scoped semi-master (`id`, `businessId`, `roleCode`, `name`, `description`, `isSystemDefault`, `isActive`).
- `BusinessRolePermission`: Business-specific mapping of role to capability codes.
- `StaffRoleAssignment`: Links `Staff` to assigned `BusinessRole` records.

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
