# Staff Validation

**Date:** 2026-05-12
**Status:** Implementation baseline

## Staff Profile Form

| Property    | Value                                             |
| ----------- | ------------------------------------------------- |
| Screen ID   | `staff.profile`                                   |
| Form ID     | `staff.profile.upsert`                            |
| Actors      | Owner, Branch Manager for assigned branches       |
| Context     | `tenantId`, `salonBusinessId`; `staffId` for edit |
| Operations  | `createStaff`, `updateStaff`                      |
| Idempotency | Required for create                               |

| Field         | Control      | Default         | Enabled when                                | Client validation           | Backend validation                                       | Error key                                  |
| ------------- | ------------ | --------------- | ------------------------------------------- | --------------------------- | -------------------------------------------------------- | ------------------------------------------ |
| `branchIds`   | multi-select | selected branch | actor can assign staff to selected branches | at least one allowed branch | every branch belongs to business and actor scope         | `error.staff.profile.branches.invalid`     |
| `displayName` | text input   | current/empty   | actor can edit staff                        | required; 2-120 chars       | required; trimmed; 2-120 chars                           | `error.staff.profile.display_name.invalid` |
| `phone`       | tel input    | current/empty   | actor can edit staff                        | required; max 30 chars      | required; normalized duplicate check where configured    | `error.staff.profile.phone.invalid`        |
| `email`       | email input  | current/empty   | actor can edit staff                        | email format when present   | email format; invite identity check where linked         | `error.staff.profile.email.invalid`        |
| `status`      | select       | `ACTIVE`        | Owner or permitted manager                  | enum                        | deactivation blocks auth/new bookings; preserves history | `error.staff.profile.status.invalid`       |

Create/edit differences:

- Create requires at least one branch.
- Edit cannot remove the last branch if future appointments exist without reassignment.

## Staff Roles Form

| Property  | Value                                    |
| --------- | ---------------------------------------- |
| Screen ID | `staff.roles`                            |
| Form ID   | `staff.roles.replace`                    |
| Actors    | Owner, delegated Branch Manager          |
| Context   | `tenantId`, `salonBusinessId`, `staffId` |
| Operation | `replaceStaffRoles`                      |

| Field     | Control                  | Default       | Enabled when                 | Client validation            | Backend validation                                                                   | Error key                   |
| --------- | ------------------------ | ------------- | ---------------------------- | ---------------------------- | ------------------------------------------------------------------------------------ | --------------------------- |
| `roleIds` | multi-select / checkbox  | current roles | actor can manage staff roles | at least one active role     | every role belongs to business and is active; actor cannot grant above own authority | `error.staff.roles.invalid` |
| `roles`   | legacy string alias list | current roles | actor can manage staff roles | mirrors `roleIds` resolution | resolved against business roles; backward compatibility                              | `error.staff.roles.invalid` |

Conflict behavior:

- Removing the final owner role in a business returns `409` with `error.staff.roles.final_owner`.
- Deleting or deactivating a business role assigned to active staff returns `409` with `error.business.roles.in_use`.

## Business Role Management Form

| Property  | Value                                      |
| --------- | ------------------------------------------ |
| Screen ID | `business.roles`                           |
| Form ID   | `business.roles.upsert`                    |
| Actors    | Owner                                      |
| Context   | `tenantId`, `salonBusinessId`              |
| Operation | `createBusinessRole`, `updateBusinessRole` |

| Field         | Control         | Default         | Enabled when | Client validation     | Backend validation                               | Error key                            |
| ------------- | --------------- | --------------- | ------------ | --------------------- | ------------------------------------------------ | ------------------------------------ |
| `name`        | text input      | current / empty | Owner only   | required; 2-60 chars  | required; unique within business; trimmed        | `error.business.role.name.invalid`   |
| `description` | text input      | empty           | Owner only   | max 255 chars         | max 255 chars                                    | `error.business.role.desc.invalid`   |
| `permissions` | checkbox group  | empty / preset  | Owner only   | at least 1 permission | valid codes from `PermissionMaster`              | `error.business.role.perm.invalid`   |
| `isActive`    | toggle / select | `true`          | Owner only   | boolean               | cannot deactivate last owner role or in-use role | `error.business.role.status.invalid` |

## Staff Skills Form

| Property  | Value                                    |
| --------- | ---------------------------------------- |
| Screen ID | `staff.skills`                           |
| Form ID   | `staff.skills.replace`                   |
| Actors    | Owner, Branch Manager                    |
| Context   | `tenantId`, `salonBusinessId`, `staffId` |
| Operation | `replaceStaffSkills`                     |

| Field        | Control      | Default        | Enabled when            | Client validation           | Backend validation                | Error key                    |
| ------------ | ------------ | -------------- | ----------------------- | --------------------------- | --------------------------------- | ---------------------------- |
| `serviceIds` | multi-select | current skills | actor can manage skills | services in active business | every service belongs to business | `error.staff.skills.invalid` |

## Staff Shift Form

| Property  | Value                                                |
| --------- | ---------------------------------------------------- |
| Screen ID | `staff.shifts`                                       |
| Form ID   | `staff.shifts.replace`                               |
| Actors    | Owner, Branch Manager                                |
| Context   | `tenantId`, `salonBusinessId`, `staffId`, `branchId` |
| Operation | `replaceStaffShifts`                                 |

| Field            | Control                  | Default         | Enabled when                            | Client validation            | Backend validation                                              | Error key                              |
| ---------------- | ------------------------ | --------------- | --------------------------------------- | ---------------------------- | --------------------------------------------------------------- | -------------------------------------- |
| `branchId`       | select                   | selected branch | staff assigned to branch                | required allowed branch      | branch belongs to business; staff assigned                      | `error.staff.shifts.branch.invalid`    |
| `timezone`       | timezone select          | branch timezone | readonly unless branch timezone changes | required                     | must match branch timezone                                      | `error.staff.shifts.timezone.invalid`  |
| `days.intervals` | weekly time range editor | empty/current   | actor can manage shifts                 | start before end; no overlap | start before end; no overlap with leave policy where applicable | `error.staff.shifts.intervals.invalid` |

## Staff Leave Block Form

| Property  | Value                                                |
| --------- | ---------------------------------------------------- |
| Screen ID | `staff.leave`                                        |
| Form ID   | `staff.leave.create`                                 |
| Actors    | Owner, Branch Manager                                |
| Context   | `tenantId`, `salonBusinessId`, `staffId`, `branchId` |
| Operation | `createStaffLeaveBlock`                              |

| Field      | Control          | Default         | Enabled when             | Client validation       | Backend validation                       | Error key                             |
| ---------- | ---------------- | --------------- | ------------------------ | ----------------------- | ---------------------------------------- | ------------------------------------- |
| `branchId` | select           | selected branch | staff assigned to branch | required allowed branch | branch/staff assignment exists           | `error.staff.leave.branch.invalid`    |
| `startsAt` | date-time picker | empty           | actor can manage leave   | before `endsAt`         | UTC; before `endsAt`; branch scope valid | `error.staff.leave.starts_at.invalid` |
| `endsAt`   | date-time picker | empty           | actor can manage leave   | after `startsAt`        | UTC; after `startsAt`                    | `error.staff.leave.ends_at.invalid`   |
| `reason`   | text input       | empty           | actor can manage leave   | required; 1-160 chars   | required; 1-160 chars; audit persisted   | `error.staff.leave.reason.required`   |

Test mapping:

- `VAL-ST-001`: cannot remove all branch assignments.
- `VAL-ST-002`: cannot grant owner role without permission.
- `VAL-ST-003`: leave end before start returns validation error.
