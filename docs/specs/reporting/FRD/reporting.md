# Reporting And Analytics Functional Requirements

**Date:** 2026-05-18
**Status:** Current planning baseline

## Functional Requirements

| ID | Requirement |
| --- | --- |
| RPT-FR-001 | Financial reports must show gross sales, discounts, tax, refunds, pending dues, payment mode totals, and net collection. |
| RPT-FR-002 | Appointment reports must show volume, status, no-show, cancellation, and peak-time data. |
| RPT-FR-003 | Staff reports must show revenue, service count, utilization, reviews, rebooking, and commission where enabled. |
| RPT-FR-004 | Customer retention reports must show new, returning, inactive, high-value, and package-expiring customers. |
| RPT-FR-005 | Inventory reports must show stock movement, low stock, wastage, expiry, transfer, retail sale, and professional consumption. |
| RPT-FR-006 | Platform reports must show tenant, branch, user, usage, error, and subscription signals. |
| RPT-FR-007 | Exports must support CSV at minimum and PDF where layout is required. |
| RPT-FR-008 | Large exports must run asynchronously and expose status. |

## Business Rules

| Rule ID | Rule |
| --- | --- |
| RPT-BR-001 | Financial reports must use finalized invoices and payments, not draft appointments. |
| RPT-BR-002 | Refunds and credits must be shown separately from sales. |
| RPT-BR-003 | Multi-branch reports must avoid double-counting transfers and shared customers. |
| RPT-BR-004 | Staff commission must use the rule snapshot active at transaction time. |
| RPT-BR-005 | Deleted/deactivated users must remain in historical reporting with safe display names. |
| RPT-BR-006 | Report access and export actions must be audited. |
