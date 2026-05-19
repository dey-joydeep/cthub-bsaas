# Reporting And Analytics Validation And Controls

**Date:** 2026-05-18
**Status:** Current planning baseline

| Rule ID | Field | Rule | Error key |
| --- | --- | --- | --- |
| RPT-VAL-001 | `dateFrom/dateTo` | Required, valid range, max range by report type. | `reporting.validation.date_range_invalid` |
| RPT-VAL-002 | `branchIds` | Must be within actor scope. | `reporting.validation.branch_forbidden` |
| RPT-VAL-003 | `staffIds` | Must belong to selected business/branch scope. | `reporting.validation.staff_invalid` |
| RPT-VAL-004 | `exportFormat` | Must be `csv` or supported `pdf`. | `reporting.validation.export_format_invalid` |
| RPT-VAL-005 | `scheduleRecipients` | Must be verified contacts and authorized recipients. | `reporting.validation.recipient_invalid` |
