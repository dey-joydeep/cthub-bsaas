# Platform Admin LLD

**Date:** 2026-05-18
**Status:** Current planning baseline

## Suggested Modules

| Module | Responsibility |
| --- | --- |
| `server-feature-platform-admin` | Platform admin use cases and controllers. |
| `server-contracts-platform-admin` | Admin ports, DTOs, and tokens. |
| `web-admin-platform` | Admin dashboard, tenants, support, flags, audit screens. |

## Commands And Queries

| Operation | Type | Notes |
| --- | --- | --- |
| `getPlatformDashboard` | Query | Aggregated health and operational status. |
| `createSalonProvisioning` | Command | Creates tenant/business/owner onboarding path idempotently. |
| `updateTenantStatus` | Command | Status transition with reason and audit. |
| `openSupportView` | Command/Query | Records access reason and returns scoped readonly view. |
| `updateFeatureFlag` | Command | Validates scope and safe default. |
| `setMaintenanceMode` | Command | Updates maintenance state and message. |
| `searchAdminAudit` | Query | Audit review with filters and pagination. |

## Transaction Rules

- Provisioning must commit tenant/business/owner invitation/audit in a recoverable sequence.
- Status update and audit record must commit together.
- Support access reason and access audit must be recorded before sensitive data is returned.

## Error Mapping

| Case | HTTP | Key |
| --- | --- | --- |
| MFA required | `403` | `platform_admin.error.mfa_required` |
| Invalid status transition | `409` | `platform_admin.error.invalid_status_transition` |
| Missing support reason | `422` | `platform_admin.validation.support_reason_required` |
| Flag scope invalid | `422` | `platform_admin.validation.flag_scope_invalid` |
