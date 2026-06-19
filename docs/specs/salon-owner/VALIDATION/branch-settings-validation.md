# Branch Settings Validation

**Date:** 2026-05-12
**Status:** Implementation baseline

## Branch Profile Form

Current implementation baseline:

- Settings API access supports `Owner`, `Platform Admin support`, and assigned Branch Manager branch-scope reads and updates.
- Branch Manager access requires an active branch assignment plus a manager-position staff record on the target branch.
- `createBranch` remains limited to `Owner` and `Platform Admin support` in this slice because business-scoped branch-creation delegation is not modeled yet.
- Branch profile currency is validated as a supported ISO 4217 code; invoice-history locking is not enforced in this slice.

| Property    | Value                                                              |
| ----------- | ------------------------------------------------------------------ |
| Screen ID   | `settings.branches.profile`                                        |
| Form ID     | `branch.profile.upsert`                                            |
| Actors      | Owner, assigned Branch Manager (edit only), Platform Admin support |
| Context     | `tenantId`, `salonBusinessId`; `branchId` for edit                 |
| Operations  | `createBranch`, `updateBranch`                                     |
| Idempotency | Required for create                                                |

| Field        | Control                 | Default          | Enabled when                                         | Client validation         | Backend validation                                      | Error key                                |
| ------------ | ----------------------- | ---------------- | ---------------------------------------------------- | ------------------------- | ------------------------------------------------------- | ---------------------------------------- |
| `businessId` | hidden/context selector | active business  | create only                                          | UUID in active scope      | business exists and actor can manage it                 | `error.branch.profile.business_required` |
| `name`       | text input              | current/empty    | actor can manage branch profile                      | required; 2-120 chars     | required; trimmed; unique per business where configured | `error.branch.profile.name.invalid`      |
| `phone`      | tel input               | current/empty    | actor can manage branch profile                      | max 30 chars              | max 30 chars                                            | `error.branch.profile.phone.invalid`     |
| `email`      | email input             | current/empty    | actor can manage branch profile                      | email format when present | email format when present                               | `error.branch.profile.email.invalid`     |
| `timezone`   | timezone select         | business default | create; edit allowed before bookings or with warning | required valid timezone   | valid timezone; affects future business-day logic       | `error.branch.profile.timezone.invalid`  |
| `currency`   | select                  | `INR`            | actor can manage branch profile                      | required 3-letter code    | required supported ISO 4217 code                        | `error.branch.profile.currency.invalid`  |
| `address`    | address group           | current/empty    | actor can manage branch profile                      | required address fields   | required address fields                                 | `error.branch.profile.address.invalid`   |

## Weekly Hours Form

| Property  | Value                                                  |
| --------- | ------------------------------------------------------ |
| Screen ID | `settings.branches.hours`                              |
| Form ID   | `branch.hours.replace`                                 |
| Actors    | Owner, assigned Branch Manager, Platform Admin support |
| Context   | `tenantId`, `salonBusinessId`, `branchId`              |
| Operation | `replaceBranchHours`                                   |

| Field       | Control         | Default           | Enabled when                 | Client validation              | Backend validation                                          | Error key                              |
| ----------- | --------------- | ----------------- | ---------------------------- | ------------------------------ | ----------------------------------------------------------- | -------------------------------------- |
| `timezone`  | timezone select | branch timezone   | branch is active or editable | required valid timezone        | matches branch timezone unless timezone update is permitted | `error.branch.hours.timezone.invalid`  |
| `days`      | weekly editor   | seven rows        | actor can manage hours       | exactly seven days             | exactly one row per day 0-6                                 | `error.branch.hours.days.invalid`      |
| `open`      | switch          | false for new day | day row editable             | boolean                        | boolean                                                     | `error.branch.hours.open.invalid`      |
| `intervals` | time range list | empty             | day is open                  | required when open; no overlap | start before end; no overlap                                | `error.branch.hours.intervals.invalid` |

Cross-field rules:

- Closed days must have no intervals.
- Open days must have at least one interval.
- Existing appointments are not changed by hours update.

Current implementation note:

- Hours update replaces stored hours without branch-scoped appointment conflict detection in this slice.

## Holiday/Special Day Form

| Property  | Value                                                  |
| --------- | ------------------------------------------------------ |
| Screen ID | `settings.branches.holidays`                           |
| Form ID   | `branch.holiday.upsert`                                |
| Actors    | Owner, assigned Branch Manager, Platform Admin support |
| Context   | `tenantId`, `salonBusinessId`, `branchId`, `date`      |
| Operation | `setBranchHoliday`                                     |

| Field       | Control                 | Default       | Enabled when              | Client validation              | Backend validation           | Error key                                |
| ----------- | ----------------------- | ------------- | ------------------------- | ------------------------------ | ---------------------------- | ---------------------------------------- |
| `date`      | date picker/route param | selected date | create only               | required ISO date              | date in branch calendar      | `error.branch.holiday.date.invalid`      |
| `closed`    | switch                  | true          | actor can manage holidays | boolean                        | boolean                      | `error.branch.holiday.closed.invalid`    |
| `reason`    | text input              | empty         | actor can manage holidays | max 160 chars                  | max 160 chars                | `error.branch.holiday.reason.invalid`    |
| `intervals` | time range list         | empty         | `closed=false`            | required when open; no overlap | start before end; no overlap | `error.branch.holiday.intervals.invalid` |

## Branch Policy Form

| Property  | Value                                                  |
| --------- | ------------------------------------------------------ |
| Screen ID | `settings.branches.policy`                             |
| Form ID   | `branch.policy.update`                                 |
| Actors    | Owner, assigned Branch Manager, Platform Admin support |
| Context   | `tenantId`, `salonBusinessId`, `branchId`              |
| Operation | `updateBranchPolicy`                                   |

| Field                       | Control      | Default          | Enabled when            | Client validation | Backend validation | Error key                                         |
| --------------------------- | ------------ | ---------------- | ----------------------- | ----------------- | ------------------ | ------------------------------------------------- |
| `bookingLeadMinutes`        | number input | business default | actor can manage policy | integer >= 0      | integer >= 0       | `error.branch.policy.booking_lead.invalid`        |
| `cancellationCutoffMinutes` | number input | business default | actor can manage policy | integer >= 0      | integer >= 0       | `error.branch.policy.cancellation_cutoff.invalid` |
| `noShowGraceMinutes`        | number input | business default | actor can manage policy | integer >= 0      | integer >= 0       | `error.branch.policy.no_show_grace.invalid`       |

Test mapping:

- `VAL-BR-001`: open day without interval fails.
- `VAL-BR-002`: overlapping intervals fail.
- `VAL-BR-003`: policy minutes above PostgreSQL integer max fail.
