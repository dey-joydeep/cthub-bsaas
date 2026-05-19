# Platform Admin Validation And Controls

**Date:** 2026-05-18
**Status:** Current planning baseline

## Forms

| Form ID | Submit operation |
| --- | --- |
| `platform.provisioning.form` | `createSalonProvisioning` |
| `platform.tenant.status.form` | `updatePlatformTenantStatus` |
| `platform.support.reason.form` | `openPlatformSupportView` |
| `platform.featureFlag.form` | `updatePlatformFeatureFlag` |
| `platform.maintenance.form` | `setPlatformMaintenanceMode` |

## Rules

| Rule ID | Field | Rule | Error key |
| --- | --- | --- | --- |
| PADM-VAL-001 | `businessName` | Required, 2 to 160 characters. | `platform_admin.validation.business_name_invalid` |
| PADM-VAL-002 | `ownerEmail` | Required valid email. | `platform_admin.validation.owner_email_invalid` |
| PADM-VAL-003 | `status` | Must be allowed transition from current state. | `platform_admin.error.invalid_status_transition` |
| PADM-VAL-004 | `reason` | Required for support access, suspension, reactivation, and maintenance. | `platform_admin.validation.reason_required` |
| PADM-VAL-005 | `featureFlagScope` | Must match flag definition. | `platform_admin.validation.flag_scope_invalid` |
| PADM-VAL-006 | `maintenanceMessage` | Required when maintenance mode is enabled. | `platform_admin.validation.maintenance_message_required` |

## Control Rules

- Mutating buttons require MFA-authenticated admin session.
- High-risk submit buttons must show confirmation.
- Support sensitive view must not load before reason is accepted.
