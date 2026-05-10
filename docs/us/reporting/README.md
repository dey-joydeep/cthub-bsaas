# Reporting And Analytics User Stories

**Date:** 2026-05-11
**Status:** Current source

## Owner Outcome

As a salon owner or platform operator, I want reliable reports and analytics so that operational, financial, staff, customer, and platform decisions are based on trusted data.

## Actors

- Salon Owner
- Branch Manager
- Accountant
- Platform Admin
- Support Admin

## Primary Screens Or Workflows

- Owner reporting dashboard
- Financial reports
- Appointment reports
- Staff performance reports
- Customer retention reports
- Inventory reports
- Platform reports
- Export/scheduled report workflow

## User Stories

### RPT-US-001: Financial report

As a salon owner, I want revenue, discount, tax, refund, pending dues, payment mode, and net collection reports so that I can reconcile business performance.

### RPT-US-002: Appointment report

As a branch manager, I want appointment volume, status, no-show, cancellation, and peak-time reports so that I can plan staffing and capacity.

### RPT-US-003: Staff performance report

As a salon owner, I want staff revenue, service count, utilization, reviews, rebooking, and commission reports so that I can coach and pay staff fairly.

### RPT-US-004: Customer retention report

As a salon owner, I want new, returning, inactive, high-value, and package-expiring customer reports so that retention campaigns can be targeted.

### RPT-US-005: Inventory report

As a branch manager, I want stock movement, low stock, wastage, expiry, transfer, retail sale, and professional consumption reports so that stock issues are visible.

### RPT-US-006: Platform report

As a platform admin, I want salon, branch, user, usage, error, and subscription signals so that SaaS operations can be monitored.

### RPT-US-007: Export and scheduled report

As an owner or accountant, I want CSV/PDF exports and scheduled email reports so that business review and accounting work can continue outside the app.

## Functional Requirements

- Support date ranges, branch filters, staff filters, service/category filters, and customer segment filters.
- Define report metrics from finalized domain records where applicable.
- Export reports as CSV at minimum; PDF where layout is required.
- Support scheduled report delivery for configured recipients.
- Show report generation timestamp and data freshness.
- Respect role and branch permissions.

## Business Rules And Edge Cases

- Financial reports must reconcile with invoices and payments, not draft appointments.
- Refunds and credit adjustments must be visible separately from sales.
- Multi-branch reports must not double-count transfers or shared customers.
- Staff commission reports must use the commission rule version active at transaction time.
- Deleted/deactivated users remain in historical reporting with safe display names.

## Acceptance Criteria

- Given finalized invoices exist, when I run financial report, then gross, discount, tax, refund, due, and net collection totals are shown.
- Given staff has completed services, when I run staff report, then service count, revenue, utilization, and commission are shown.
- Given stock moved between branches, when I run inventory report, then source and destination movement are both traceable.
- Given I do not have branch permission, when I run a report, then unauthorized branch data is excluded.

## Non-Functional Requirements

- Common reports should load within acceptable dashboard/reporting latency for a single branch.
- Large exports should run asynchronously.
- Report definitions must be testable and documented.
- Report access and export actions must be audited.
