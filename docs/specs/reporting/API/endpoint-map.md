# Reporting And Analytics API Endpoint Map

**Date:** 2026-05-18
**Status:** Target planning contract

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
