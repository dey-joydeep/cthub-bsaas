# Business Settings Validation

**Date:** 2026-05-12
**Status:** Implementation baseline

## Business Profile Form

| Property    | Value                                                         |
| ----------- | ------------------------------------------------------------- |
| Screen ID   | `settings.business.profile`                                   |
| Form ID     | `business.profile.upsert`                                     |
| Actors      | Owner, delegated Branch Manager, Platform Admin support       |
| Context     | `tenantId`, `salonBusinessId` for edit; `tenantId` for create |
| Operations  | `createSalonBusiness`, `updateSalonBusiness`                  |
| Idempotency | Required for create; not required for edit                    |

| Field         | Control    | Default                       | Enabled when                      | Client validation     | Backend validation                                         | Error key                                     |
| ------------- | ---------- | ----------------------------- | --------------------------------- | --------------------- | ---------------------------------------------------------- | --------------------------------------------- |
| `displayName` | text input | empty/create, current/edit    | actor can manage business profile | required; 2-120 chars | required; 2-120 chars; trimmed                             | `error.business.profile.display_name.invalid` |
| `legalName`   | text input | empty/create, current/edit    | actor can manage business profile | required; 2-160 chars | required; 2-160 chars; trimmed                             | `error.business.profile.legal_name.invalid`   |
| `status`      | select     | `ACTIVE` create, current/edit | Owner or delegated admin          | required enum         | enum; inactive blocks new branch activity where configured | `error.business.profile.status.invalid`       |

Cross-field rules:

- `displayName` and `legalName` can match.
- Deactivating a business with active branches requires backend conflict unless allowed by admin policy.

Conflict behavior:

- Duplicate business identity in same tenant returns `409` with `error.business.profile.duplicate`.

Test mapping:

- `VAL-BUS-001`: create rejects missing display name.
- `VAL-BUS-002`: edit blocks unauthorized manager.
- `VAL-BUS-003`: duplicate business returns conflict.

## Legal Registration Form

| Property    | Value                                                                         |
| ----------- | ----------------------------------------------------------------------------- |
| Screen ID   | `settings.business.legal`                                                     |
| Form ID     | `business.legal.upsert`                                                       |
| Actors      | Owner, delegated Branch Manager, Accountant read-only, Platform Admin support |
| Context     | `tenantId`, `salonBusinessId`                                                 |
| Operation   | legal registration upsert service command                                     |
| Idempotency | Required for create; not required for edit                                    |

| Field               | Control       | Default                 | Enabled when               | Client validation     | Backend validation                                            | Error key                                        |
| ------------------- | ------------- | ----------------------- | -------------------------- | --------------------- | ------------------------------------------------------------- | ------------------------------------------------ |
| `registrationName`  | text input    | current or empty        | actor can manage legal/tax | required; 2-160 chars | required; trimmed; 2-160 chars                                | `error.business.legal.registration_name.invalid` |
| `gstin`             | text input    | current or empty        | actor can manage legal/tax | uppercase; optional   | GSTIN format when present; uniqueness per legal profile       | `error.business.legal.gstin.invalid`             |
| `invoicePrefix`     | text input    | branch/business default | actor can manage legal/tax | required; 1-20 chars  | required; unique in legal registration scope where configured | `error.business.legal.invoice_prefix.invalid`    |
| `registeredAddress` | address group | current or empty        | actor can manage legal/tax | address fields valid  | address fields valid                                          | `error.business.legal.address.invalid`           |
| `status`            | select        | `ACTIVE`                | Owner or delegated admin   | required enum         | inactive profile cannot be selected for future invoices       | `error.business.legal.status.invalid`            |

Dependent behavior:

- Changing `status` to `INACTIVE` disables future invoice-profile selection after save.
- Existing finalized invoices remain unchanged.

Test mapping:

- `VAL-BUS-010`: GSTIN invalid format returns field error.
- `VAL-BUS-011`: inactive registration cannot be selected for new invoice profile.
