# Platform Admin Functional Requirements

**Date:** 2026-05-18
**Status:** Current planning baseline

## Owner Outcome

Platform administrators must be able to operate the SaaS safely across many salon businesses without bypassing audit, tenant isolation, or privacy constraints.

## Functional Requirements

| ID          | Requirement                                                                                                                |
| ----------- | -------------------------------------------------------------------------------------------------------------------------- |
| PADM-FR-001 | Platform dashboard must show tenant count, active users, operational errors, onboarding status, and system health signals. |
| PADM-FR-002 | Admins must be able to provision a salon business and first owner onboarding path.                                         |
| PADM-FR-003 | Tenant and business status must support pending, active, suspended, inactive, and archived states where applicable.        |
| PADM-FR-004 | Support admins must have permission-scoped views and must provide an access reason for sensitive support views.            |
| PADM-FR-005 | Platform admin mutations must require MFA-authenticated admin session.                                                     |
| PADM-FR-006 | Feature flags must be scoped by platform, tenant, business, or branch as documented by flag definition.                    |
| PADM-FR-007 | Maintenance mode must show configured messaging and block affected operations according to policy.                         |
| PADM-FR-008 | Admin audit views must show actor, action, target, reason, timestamp, and correlation ID.                                  |

## Business Rules

| Rule ID     | Rule                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------- |
| PADM-BR-001 | Every platform admin mutation must write an audit record.                                                                 |
| PADM-BR-002 | Support access to sensitive business or customer data requires reason capture before access.                              |
| PADM-BR-003 | Support access must not expose secrets, credentials, raw payment data, or private provider tokens.                        |
| PADM-BR-004 | Salon suspension must block new operational writes while preserving read access required for support and legal retention. |
| PADM-BR-005 | Provisioning must be idempotent or recoverable after partial failure.                                                     |
| PADM-BR-006 | Feature flags must default to safe disabled state unless explicitly configured otherwise.                                 |

## Status Transitions

| From             | To        | Actor          | Rule                                                              |
| ---------------- | --------- | -------------- | ----------------------------------------------------------------- |
| Pending          | Active    | Platform admin | Owner onboarding and required business details complete.          |
| Active           | Suspended | Platform admin | Requires reason and audit.                                        |
| Suspended        | Active    | Platform admin | Requires reason and resolution note.                              |
| Active/Suspended | Inactive  | Platform admin | Blocks normal operation according to retention policy.            |
| Inactive         | Archived  | Platform admin | Allowed only when retention and export obligations are satisfied. |
