# Reporting And Analytics Web Specification

**Date:** 2026-05-18
**Status:** Current planning baseline

## Routes

| Route                           | Screen ID              |
| ------------------------------- | ---------------------- |
| `/partner/reports/financial`    | `reports.financial`    |
| `/partner/reports/appointments` | `reports.appointments` |
| `/partner/reports/staff`        | `reports.staff`        |
| `/partner/reports/customers`    | `reports.customers`    |
| `/partner/reports/inventory`    | `reports.inventory`    |
| `/partner/reports/exports`      | `reports.exports`      |

## Screen Requirements

- Filters must show selected date range, branch, staff, service/category, and segment.
- Reports must show generated-at and data freshness.
- Export actions must show async progress for large exports.
- Empty state must distinguish no data from filtered-out data.
