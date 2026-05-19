# Data Privacy And Governance Functional Requirements

**Date:** 2026-05-18
**Status:** Current planning baseline

## Functional Requirements

| ID | Requirement |
| --- | --- |
| DATA-FR-001 | Customer, staff, invoice, report, setting, and note access must follow role and scope permissions. |
| DATA-FR-002 | Retention policy must distinguish audit logs, invoices, notifications, customer profiles, staff profiles, and support records. |
| DATA-FR-003 | Data export must be scoped by actor permission, branch/business scope, and date range. |
| DATA-FR-004 | Customer deletion requests must support review, anonymization, legal retention, and completion status. |
| DATA-FR-005 | Staff deactivation must preserve historical appointment and invoice attribution. |
| DATA-FR-006 | Customer merge must be strongly audited and must preserve source profile references. |
| DATA-FR-007 | Restricted notes must not appear in broad exports unless policy and actor permission allow it. |
| DATA-FR-008 | Support admin sensitive access must capture reason and audit before data is returned. |

## Business Rules

| Rule ID | Rule |
| --- | --- |
| DATA-BR-001 | Customer deletion must not remove invoices or audit records required for business/legal retention. |
| DATA-BR-002 | Anonymization must remove or mask direct identifiers while preserving required financial and audit references. |
| DATA-BR-003 | Customer merge must not cross salon business boundaries unless a future policy explicitly allows it. |
| DATA-BR-004 | Export jobs must include generation timestamp, scope, actor, and filters. |
| DATA-BR-005 | Privacy-sensitive logs must redact direct identifiers where full value is not required. |
