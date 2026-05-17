# Account And Profile Functional Requirements

**Date:** 2026-05-18
**Status:** Current planning baseline

## Owner Outcome

Every user must be able to manage permitted profile, security, preference, and privacy settings without weakening account security or tenant/business data isolation.

## Feature Areas

| Area | Scope |
| --- | --- |
| Profile details | Display name, phone, avatar reference, locale, time zone, role-specific readonly fields. |
| Security settings | Password change, MFA, passkeys, recovery codes, active sessions, login history. |
| Connected accounts | Customer social login providers and unlink safeguards. |
| Communication preferences | Transactional, in-app, email, SMS/WhatsApp, and marketing preferences. |
| Privacy entry points | Data export/delete request entry and consent review. |

## Functional Requirements

| ID | Requirement |
| --- | --- |
| PROF-FR-001 | Users must see role-appropriate profile fields. |
| PROF-FR-002 | Users may edit only fields allowed for their role and current state. |
| PROF-FR-003 | Security-sensitive changes must require recent authentication where policy requires. |
| PROF-FR-004 | Users must not be allowed to remove their last usable sign-in method. |
| PROF-FR-005 | Password changes must revoke sessions according to Auth policy. |
| PROF-FR-006 | MFA, passkeys, sessions, and recovery-code operations must delegate to Auth contracts. |
| PROF-FR-007 | Marketing opt-out must not disable transactional notifications. |
| PROF-FR-008 | Staff operational fields such as branch assignment or service skill must be edited through staff management, not self profile. |
| PROF-FR-009 | Privacy requests must route to privacy/governance workflow, not immediate destructive action unless policy allows. |

## Business Rules

| Rule ID | Rule |
| --- | --- |
| PROF-BR-001 | Profile changes must be audited when they affect identity, contactability, security, consent, or operational access. |
| PROF-BR-002 | Email and phone changes must verify the new channel before it becomes trusted for security or notifications. |
| PROF-BR-003 | Social account unlink is allowed only when another verified sign-in method remains. |
| PROF-BR-004 | Communication preferences must be scoped by user and may also be constrained by customer profile consent per business. |
| PROF-BR-005 | Account deletion must respect invoices, audit logs, legal retention, and business-owned customer records. |

## Error Outcomes

| Case | Required outcome |
| --- | --- |
| Last sign-in method unlink attempted | Return `409` with `account_profile.error.last_sign_in_method`. |
| Recent auth required | Return `403` with `account_profile.error.reauth_required`. |
| Invalid current password | Return `401` or `422` according to Auth contract without leaking sensitive state. |
| Staff tries to edit owner-controlled operational field | Return `403`. |
