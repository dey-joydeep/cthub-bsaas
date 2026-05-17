# Service Catalog Validation

**Date:** 2026-05-12
**Status:** Implementation baseline

## Service Category Form

| Property    | Value                                                    |
| ----------- | -------------------------------------------------------- |
| Screen ID   | `services.categories`                                    |
| Form ID     | `service.category.upsert`                                |
| Actors      | Owner, Branch Manager                                    |
| Context     | `tenantId`, `salonBusinessId`                            |
| Operations  | `createServiceCategory`, category update service command |
| Idempotency | Required for create                                      |

| Field       | Control      | Default            | Enabled when             | Client validation     | Backend validation                             | Error key                                   |
| ----------- | ------------ | ------------------ | ------------------------ | --------------------- | ---------------------------------------------- | ------------------------------------------- |
| `name`      | text input   | empty/current      | actor can manage catalog | required; 2-120 chars | required; unique per business where configured | `error.service.category.name.invalid`       |
| `sortOrder` | number input | next order/current | actor can manage catalog | integer >= 0          | integer >= 0                                   | `error.service.category.sort_order.invalid` |

## Service Editor Form

| Property    | Value                                               |
| ----------- | --------------------------------------------------- |
| Screen ID   | `services.editor`                                   |
| Form ID     | `service.upsert`                                    |
| Actors      | Owner, Branch Manager                               |
| Context     | `tenantId`, `salonBusinessId`; `serviceId` for edit |
| Operations  | `createService`, `updateService`                    |
| Idempotency | Required for create                                 |

| Field             | Control       | Default                  | Enabled when             | Client validation             | Backend validation                                      | Error key                                 |
| ----------------- | ------------- | ------------------------ | ------------------------ | ----------------------------- | ------------------------------------------------------- | ----------------------------------------- |
| `categoryId`      | select        | first category/current   | categories loaded        | required category in business | category belongs to business                            | `error.service.editor.category.invalid`   |
| `name`            | text input    | empty/current            | actor can manage catalog | required; 2-120 chars         | required; unique per category/business where configured | `error.service.editor.name.invalid`       |
| `durationMinutes` | number input  | 30/current               | actor can manage catalog | integer 5-720                 | integer 5-720; existing appointments unchanged          | `error.service.editor.duration.invalid`   |
| `bufferMinutes`   | number input  | 0/current                | actor can manage catalog | integer >= 0                  | integer >= 0                                            | `error.service.editor.buffer.invalid`     |
| `basePrice`       | money input   | `0.00`/current           | actor can manage catalog | decimal string; >= 0          | decimal string; >= 0; no float math                     | `error.service.editor.base_price.invalid` |
| `taxRatePercent`  | percent input | business default/current | actor can manage catalog | decimal string; scale 2       | decimal string; policy range                            | `error.service.editor.tax_rate.invalid`   |
| `status`          | select        | `ACTIVE`/current         | actor can manage catalog | enum                          | inactive blocks new bookings/invoice lines              | `error.service.editor.status.invalid`     |

Create/edit differences:

- Create requires category.
- Edit of duration/price affects future appointments only.
- Inactive service remains visible in history and read-only transaction snapshots.

## Service Staff Eligibility Form

| Property  | Value                                                           |
| --------- | --------------------------------------------------------------- |
| Screen ID | `services.eligibility`                                          |
| Form ID   | `service.staff_eligibility.replace`                             |
| Actors    | Owner, Branch Manager                                           |
| Context   | `tenantId`, `salonBusinessId`, `serviceId`, optional `branchId` |
| Operation | `replaceServiceStaffEligibility`                                |

| Field      | Control      | Default             | Enabled when             | Client validation                      | Backend validation                                                   | Error key                                 |
| ---------- | ------------ | ------------------- | ------------------------ | -------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------- |
| `staffIds` | multi-select | current eligibility | actor can manage catalog | staff belong to business/branch filter | staff belong to business; active assignment for branch-specific view | `error.service.eligibility.staff.invalid` |

## Branch Service Override Form

| Property  | Value                                                  |
| --------- | ------------------------------------------------------ |
| Screen ID | `services.branch_override`                             |
| Form ID   | `service.branch_override.upsert`                       |
| Actors    | Owner, Branch Manager                                  |
| Context   | `tenantId`, `salonBusinessId`, `branchId`, `serviceId` |
| Operation | branch override command                                |

| Field                     | Control      | Default             | Enabled when            | Client validation    | Backend validation                      | Error key                                   |
| ------------------------- | ------------ | ------------------- | ----------------------- | -------------------- | --------------------------------------- | ------------------------------------------- |
| `priceOverride`           | money input  | service base price  | branch override enabled | decimal string; >= 0 | decimal string; >= 0                    | `error.service.override.price.invalid`      |
| `durationOverrideMinutes` | number input | service duration    | branch override enabled | integer 5-720        | integer 5-720                           | `error.service.override.duration.invalid`   |
| `visibleOnline`           | switch       | service default     | branch override enabled | boolean              | boolean                                 | `error.service.override.visibility.invalid` |
| `eligibleStaffIds`        | multi-select | service eligibility | branch override enabled | active branch staff  | active branch staff with required skill | `error.service.override.staff.invalid`      |

Test mapping:

- `VAL-SVC-001`: service duration below 5 fails.
- `VAL-SVC-002`: inactive service cannot be used for new booking.
- `VAL-SVC-003`: branch override staff outside branch fails.
