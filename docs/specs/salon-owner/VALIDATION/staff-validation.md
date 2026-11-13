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

| Field     | Control                  | Default       | Enabled when                 | Client validation             | Backend validation                                                                   | Error key                   |
| --------- | ------------------------ | ------------- | ---------------------------- | ----------------------------- | ------------------------------------------------------------------------------------ | --------------------------- |
| `roleIds` | multi-select / checkbox  | current roles | actor can manage staff roles | at least one active role      | every role belongs to business and is active; actor cannot grant above own authority | `error.staff.roles.invalid` |
| `roles`   | legacy string alias list | current roles | actor can manage staff roles | mirrors `roleIds` resolution  | resolved against business roles; backward compatibility                              | `error.staff.roles.invalid` |

Conflict behavior:

- Removing the final owner role in a business returns `409` with `error.staff.roles.final_owner`.
- Deleting or deactivating a business role assigned to active staff returns `409` with `error.business.roles.in_use`.

## Business Role Management Form

| Property  | Value                                    |
| --------- | ---------------------------------------- |
| Screen ID | `business.roles`                         |
| Form ID   | `business.roles.upsert`                  |
| Actors    | Owner                                    |
| Context   | `tenantId`, `salonBusinessId`            |
| Operation | `createBusinessRole`, `updateBusinessRole` |

| Field         | Control         | Default         | Enabled when   | Client validation     | Backend validation                                  | Error key                             |
| ------------- | --------------- | --------------- | -------------- | --------------------- | --------------------------------------------------- | ------------------------------------- |
| `name`        | text input      | current / empty | Owner only     | required; 2-60 chars  | required; unique within business; trimmed           | `error.business.role.name.invalid`    |
| `description` | text input      | empty           | Owner only     | max 255 chars         | max 255 chars                                       | `error.business.role.desc.invalid`    |
| `permissions` | checkbox group  | empty / preset  | Owner only     | at least 1 permission | valid codes from `PermissionMaster`                 | `error.business.role.perm.invalid`    |
| `isActive`    | toggle / select | `true`          | Owner only     | boolean               | cannot deactivate last owner role or in-use role    | `error.business.role.status.invalid`  |

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

## Staff Personal and HR Details Form

| Property  | Value                                                |
| --------- | ---------------------------------------------------- |
| Screen ID | `staff.personal`                                     |
| Form ID   | `staff.personal.upsert`                              |
| Actors    | Owner, Branch Manager (assigned branch), Self (scoped) |
| Context   | `tenantId`, `salonBusinessId`, `staffId`             |
| Operation | `updateStaffPersonalDetails`, `selfUpdateStaffContact` |

| Field | Control | Default | Enabled when | Client validation | Backend validation | Error key |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `legalName` | text input | current/empty | Owner, Branch Manager only | optional; 2-120 chars | trimmed; 2-120 chars | `error.staff.personal.legal_name.invalid` |
| `dateOfBirth` | date picker | current/empty | Owner, Branch Manager only | optional; past date (>15 yrs) | ISO-8601; minimum 15 yrs age | `error.staff.personal.dob.invalid` |
| `gender` | select | current/empty | Owner, Branch Manager only | enum | optional enum (`MALE`, `FEMALE`, `NON_BINARY`, `OTHER`) | `error.staff.personal.gender.invalid` |
| `employmentType` | select | `FULL_TIME` | Owner, Branch Manager only | required; enum | required enum (`FULL_TIME`, `PART_TIME`, `CONTRACTOR`, `APPRENTICE`) | `error.staff.personal.employment_type.invalid` |
| `hireDate` | date picker | current date | Owner, Branch Manager only | required; date | required valid date | `error.staff.personal.hire_date.invalid` |
| `terminationDate` | date picker | empty | Owner, Branch Manager only | after `hireDate` | optional; must be after `hireDate` | `error.staff.personal.termination_date.invalid` |
| `address.line1` | text input | current/empty | Owner, Branch Manager, Self | required if address present; max 120 | trimmed; max 120 chars | `error.staff.personal.address.line1.invalid` |
| `address.line2` | text input | current/empty | Owner, Branch Manager, Self | optional; max 120 | trimmed; max 120 chars | `error.staff.personal.address.line2.invalid` |
| `address.city` | text input | current/empty | Owner, Branch Manager, Self | required if address present; max 60 | trimmed; max 60 chars | `error.staff.personal.address.city.invalid` |
| `address.state` | text input | current/empty | Owner, Branch Manager, Self | required if address present; max 60 | trimmed; max 60 chars | `error.staff.personal.address.state.invalid` |
| `address.postalCode`| text input | current/empty | Owner, Branch Manager, Self | postal regex (e.g. `^\d{3}-?\d{4}$`) | postal format valid | `error.staff.personal.address.postal_code.invalid` |
| `emergencyContact.name` | text input | current/empty | Owner, Branch Manager, Self | 2-60 chars | trimmed; 2-60 chars | `error.staff.personal.emergency.name.invalid` |
| `emergencyContact.relationship` | text/select | current/empty | Owner, Branch Manager, Self | max 40 chars | trimmed; max 40 chars | `error.staff.personal.emergency.relation.invalid` |
| `emergencyContact.phone` | tel input | current/empty | Owner, Branch Manager, Self | tel format; max 30 chars | normalized tel format | `error.staff.personal.emergency.phone.invalid` |
| `payoutMethod` | select | `CASH` | Owner, Branch Manager only | required enum (`BANK_TRANSFER`, `CASH`) | required enum | `error.staff.personal.payout_method.invalid` |
| `bankDetails.bankName` | text input | current/empty | Owner, Branch Manager only | required if `payoutMethod === BANK_TRANSFER` | 1-80 chars | `error.staff.personal.bank.name.invalid` |
| `bankDetails.branchName` | text input | current/empty | Owner, Branch Manager only | required if `payoutMethod === BANK_TRANSFER` | 1-80 chars | `error.staff.personal.bank.branch.invalid` |
| `bankDetails.accountType` | select | `ORDINARY` | Owner, Branch Manager only | required if `payoutMethod === BANK_TRANSFER` | enum (`ORDINARY`, `CURRENT`) | `error.staff.personal.bank.account_type.invalid` |
| `bankDetails.accountNumber` | text input | current/empty | Owner, Branch Manager only | required if `payoutMethod === BANK_TRANSFER`; 4-10 digits | numeric string 4-10 digits | `error.staff.personal.bank.account_number.invalid` |
| `bankDetails.accountHolder` | text input | current/empty | Owner, Branch Manager only | required if `payoutMethod === BANK_TRANSFER`; max 80 | trimmed; max 80 chars | `error.staff.personal.bank.account_holder.invalid` |

## Staff Proof of Identity Document Upload

| Property | Value |
| :--- | :--- |
| Screen ID | `staff.documents` |
| Form ID | `staff.document.upload` |
| Actors | Owner, Branch Manager (assigned branch) |
| Context | `tenantId`, `salonBusinessId`, `staffId` |
| Operation | `uploadStaffIdentityDocument`, `verifyStaffIdentityDocument` |

| Field | Control | Validation Rules | Error Key |
| :--- | :--- | :--- | :--- |
| `documentType` | select | required; enum (`DRIVERS_LICENSE`, `RESIDENCE_CARD`, `PASSPORT`, `MY_NUMBER_CARD`, `OTHER`) | `error.staff.document.type.invalid` |
| `file` | file input | required; max 10MB; MIME in (`image/jpeg`, `image/png`, `application/pdf`) | `error.staff.document.file.invalid` |

Test mapping:

- `VAL-ST-001`: cannot remove all branch assignments.
- `VAL-ST-002`: cannot grant owner role without permission.
- `VAL-ST-003`: leave end before start returns validation error.
- `VAL-ST-004`: staff self-edit rejects attempts to modify `legalName`, `hireDate`, `roles`, or `employmentType`.
- `VAL-ST-005`: bank details required when `payoutMethod` is `BANK_TRANSFER`.
- `VAL-ST-006`: document upload rejects file exceeding 10MB or unsupported MIME types.
