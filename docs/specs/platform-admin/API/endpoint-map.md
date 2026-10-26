# Platform Admin API Endpoint Map

**Date:** 2026-05-18
**Status:** Traceability index for project-wide OpenAPI

| Capability           | Method  | Path                                  | Operation ID                 |
| -------------------- | ------- | ------------------------------------- | ---------------------------- |
| Dashboard            | `GET`   | `/admin/platform/dashboard`           | `getPlatformDashboard`       |
| Create provisioning  | `POST`  | `/admin/platform/provisioning/salons` | `createSalonProvisioning`    |
| List tenants         | `GET`   | `/admin/platform/tenants`             | `listPlatformTenants`        |
| Get tenant           | `GET`   | `/admin/platform/tenants/{id}`        | `getPlatformTenant`          |
| Update tenant status | `POST`  | `/admin/platform/tenants/{id}/status` | `updatePlatformTenantStatus` |
| Open support view    | `POST`  | `/admin/platform/support/views`       | `openPlatformSupportView`    |
| List feature flags   | `GET`   | `/admin/platform/feature-flags`       | `listPlatformFeatureFlags`   |
| Update feature flag  | `PATCH` | `/admin/platform/feature-flags/{key}` | `updatePlatformFeatureFlag`  |
| Set maintenance mode | `PUT`   | `/admin/platform/maintenance`         | `setPlatformMaintenanceMode` |
| Search admin audit   | `GET`   | `/admin/platform/audit`               | `searchPlatformAdminAudit`   |

## OpenAPI Rule

These operations are represented in [Project-Wide Supporting OpenAPI](../../project-wide/API/openapi.yaml). This endpoint map remains the feature traceability index.
