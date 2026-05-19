# Reporting And Analytics API Endpoint Map

**Date:** 2026-05-18
**Status:** Traceability index for project-wide OpenAPI

These operations are represented in [Project-Wide Supporting OpenAPI](../../project-wide/API/openapi.yaml). This endpoint map remains the feature traceability index.

| Capability | Method | Path | Operation ID |
| --- | --- | --- | --- |
| Financial report | `GET` | `/partner/reports/financial` | `getFinancialReport` |
| Appointment report | `GET` | `/partner/reports/appointments` | `getAppointmentReport` |
| Staff report | `GET` | `/partner/reports/staff` | `getStaffPerformanceReport` |
| Customer retention report | `GET` | `/partner/reports/customers/retention` | `getCustomerRetentionReport` |
| Inventory report | `GET` | `/partner/reports/inventory` | `getInventoryReport` |
| Create export | `POST` | `/partner/reports/exports` | `createReportExport` |
| Export status | `GET` | `/partner/reports/exports/{id}` | `getReportExportStatus` |
| Platform report | `GET` | `/admin/platform/reports/overview` | `getPlatformReportOverview` |
