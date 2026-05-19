# Integrations Functional Requirements

**Date:** 2026-05-18
**Status:** Current planning baseline

## Functional Requirements

| ID | Requirement |
| --- | --- |
| INT-FR-001 | Provider credentials must be stored securely and never exposed to client apps. |
| INT-FR-002 | Provider adapters must hide provider-specific behavior behind internal ports. |
| INT-FR-003 | Payment integrations must support idempotency and reconciliation references. |
| INT-FR-004 | Messaging/email integrations must expose delivery status to Notifications. |
| INT-FR-005 | Webhooks must validate signatures where providers support them. |
| INT-FR-006 | Provider outage must degrade gracefully and expose support-visible status. |
| INT-FR-007 | Calendar export must avoid private staff/customer notes. |

## Business Rules

| Rule ID | Rule |
| --- | --- |
| INT-BR-001 | Failed notification delivery must not roll back booking or billing transactions. |
| INT-BR-002 | Payment capture must not be retried without idempotency protection. |
| INT-BR-003 | Invalid webhook signatures must be rejected and audited. |
| INT-BR-004 | Branch-specific provider configuration overrides business default only where enabled. |
| INT-BR-005 | Provider configuration screens must not show raw secrets after save. |
