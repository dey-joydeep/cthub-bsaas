# Platform Admin API Endpoint Map

**Date:** 2026-05-18
**Status:** Target planning contract

| Capability | Method | Path | Operation ID |
| --- | --- | --- | --- |
| Dashboard | `GET` | `/admin/platform/dashboard` | `getPlatformDashboard` |
| Create provisioning | `POST` | `/admin/platform/provisioning/salons` | `createSalonProvisioning` |
| List tenants | `GET` | `/admin/platform/tenants` | `listPlatformTenants` |
| Get tenant | `GET` | `/admin/platform/tenants/{id}` | `getPlatformTenant` |
| Update tenant status | `POST` | `/admin/platform/tenants/{id}/status` | `updatePlatformTenantStatus` |
| Open support view | `POST` | `/admin/platform/support/views` | `openPlatformSupportView` |
| List feature flags | `GET` | `/admin/platform/feature-flags` | `listPlatformFeatureFlags` |
| Update feature flag | `PATCH` | `/admin/platform/feature-flags/{key}` | `updatePlatformFeatureFlag` |
| Set maintenance mode | `PUT` | `/admin/platform/maintenance` | `setPlatformMaintenanceMode` |
| Search admin audit | `GET` | `/admin/platform/audit` | `searchPlatformAdminAudit` |

## OpenAPI Rule

Before implementation, these operations must be represented in a platform admin OpenAPI contract.
