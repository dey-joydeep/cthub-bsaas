# Data Privacy And Governance User Stories

**Date:** 2026-05-11
**Status:** Current source

## Owner Outcome

As a platform operator and salon business, I want clear data governance and privacy behavior so that customer, staff, billing, and audit data are handled responsibly.

## Actors

- Customer
- Staff
- Salon Owner
- Platform Admin
- Support Admin

## User Stories

### DATA-US-001: Data access control

As a salon owner, I want customer, staff, invoice, and business data access controlled by role and branch so that private information is not overexposed.

### DATA-US-002: Data retention

As a platform operator, I want retention policies for audit, invoice, notification, and customer data so that legal and operational needs are balanced.

### DATA-US-003: Data export

As an authorized user, I want to export allowed data so that business review, accounting, or privacy requests can be fulfilled.

### DATA-US-004: Account/data deletion request

As a customer, I want a path to request account deletion or data handling so that privacy expectations are respected.

### DATA-US-005: Duplicate and merge governance

As a salon owner, I want controlled duplicate merge behavior so that customer history is accurate without accidental data loss.

## Functional Requirements

- Define role-based access to customer profile, staff profile, invoices, reports, settings, and notes.
- Preserve legally relevant records such as invoices and audit logs according to policy.
- Support export for customer, branch, reporting, and accounting data where authorized.
- Track data merge and deletion/closure requests.
- Distinguish soft-delete, anonymization, and legal retention states where applicable.

## Business Rules And Edge Cases

- Customer deletion must not remove invoices or audit records required for business/legal reasons.
- Staff deactivation must preserve historical appointment and invoice attribution.
- Customer merge must be reversible or strongly audited.
- Sensitive notes may require restricted access and should not appear in broad exports without policy.
- Support admins need reason-coded access for sensitive views.

## Acceptance Criteria

- Given staff lacks permission for restricted customer notes, when they open profile, then restricted notes are hidden.
- Given owner merges duplicate customers, when profile is viewed, then history is consolidated and audit trail exists.
- Given customer requests deletion, when request is processed, then retained records and removed/anonymized fields follow policy.
- Given accountant exports invoices, then only authorized branch and date-range records are included.

## Non-Functional Requirements

- PII access must be auditable.
- Export jobs should be asynchronous for large data.
- Data governance rules must be documented before production launch.
- Privacy-sensitive workflows must avoid leaking data through logs.
