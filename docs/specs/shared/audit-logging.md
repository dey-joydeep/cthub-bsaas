# Audit Logging

**Date:** 2026-05-18
**Status:** Current cross-cutting baseline

## Purpose

Define which operations require audit records and what each record must contain.

## Audit Principles

- Audit logs exist to reconstruct important business, security, and support actions.
- Audit logs must not store secrets, raw tokens, passwords, payment credentials, or unnecessary PII.
- Audit records must be append-only from application perspective.
- Audit records must include correlation IDs when available.

## Required Audit Fields

| Field | Rule |
| --- | --- |
| `id` | Unique audit record ID. |
| `occurredAt` | UTC timestamp when the audited action occurred. |
| `actorUserId` | Authenticated user ID when available. |
| `actorType` | Platform, owner, staff, customer, system, or anonymous. |
| `tenantId` | Required when action is tenant-scoped. |
| `businessId` | Required when action is salon-business-scoped. |
| `branchId` | Required when action is branch-scoped. |
| `action` | Stable action key such as `appointment.cancelled`. |
| `targetType` | Resource type. |
| `targetId` | Resource ID when available. |
| `correlationId` | Request correlation ID when available. |
| `before` | Redacted before snapshot for high-risk changes. |
| `after` | Redacted after snapshot for high-risk changes. |
| `metadata` | Redacted structured context. |

## Operations Requiring Audit

| Category | Examples |
| --- | --- |
| Authentication security | Login failure lockout, MFA enrollment, passkey change, session revocation. |
| Permission and role changes | Staff role, branch assignment, platform support action. |
| Business configuration | Cancellation policy, tax/payment settings, business/branch status. |
| Operational state changes | Appointment cancel/no-show, invoice finalization, payment capture, refund, stock adjustment. |
| Customer privacy | Consent change, data export, data deletion/anonymization, restricted note access. |
| External integrations | Provider connected/disconnected, webhook failure, payment callback mismatch. |

## Redaction Rules

- Passwords, tokens, OTPs, recovery codes, and secrets must never be logged.
- Payment card data must not be logged.
- Phone/email may be masked unless needed for support investigation.
- Customer notes must be logged only as changed/not changed unless a feature explicitly requires redacted diff.

## Retention

Feature docs must define retention where legal or business rules require it. If unspecified:

- security audit logs: retain at least 365 days;
- operational audit logs: retain at least 365 days;
- debug metadata: retain according to observability/log retention policy.

## Test Requirements

High-risk write operations must test that:

- an audit record is written on success;
- no audit record is written for fully rejected validation failures unless security requires it;
- denied access attempts are logged when security-sensitive;
- redaction removes secrets and sensitive fields;
- correlation ID is propagated.
