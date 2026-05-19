# Reporting And Analytics LLD

**Date:** 2026-05-18
**Status:** Current planning baseline

## Queries And Commands

| Operation | Type | Notes |
| --- | --- | --- |
| `getFinancialReport` | Query | Finalized financial records only. |
| `getAppointmentReport` | Query | Appointment status and time buckets. |
| `getStaffPerformanceReport` | Query | Staff service/revenue/utilization. |
| `getCustomerRetentionReport` | Query | Segments and retention periods. |
| `getInventoryReport` | Query | Stock ledger and branch filters. |
| `createReportExport` | Command | Async export job for large data. |
| `getReportExportStatus` | Query | Export job state and download readiness. |

## Freshness Rules

- Dashboard snapshots may use cached read models.
- Financial export must state generation timestamp and source cutoff.
- Scheduled reports must include data period and generation timestamp.

## Test Implications

Tests must verify metric formulas, branch scope filtering, export audit, and async export state transitions.
