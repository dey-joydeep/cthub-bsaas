# Account And Profile User Stories

**Date:** 2026-05-11
**Status:** Current planning source

## Owner Outcome

As a user, I want account, profile, security, and preference controls appropriate to my role so that my identity, communication, and privacy settings remain accurate.

## Actors

- Customer
- Staff
- Salon Owner
- Platform Admin

## Primary Screens Or Workflows

- Account profile
- Security settings
- Connected accounts
- Notification preferences
- Privacy and data controls

## User Stories

### PROF-US-001: Profile details

As a user, I want to update allowed profile fields so that my account information stays accurate.

### PROF-US-002: Security settings

As a user, I want to change password, manage MFA, view login history, and review active sessions so that my account remains secure.

### PROF-US-003: Connected accounts

As a customer, I want to link or unlink supported social login providers so that sign-in remains convenient without losing account access.

### PROF-US-004: Communication preferences

As a user, I want to manage email, in-app, WhatsApp/SMS, and marketing preferences so that communication matches my consent.

### PROF-US-005: Data and privacy

As a user, I want appropriate data download/delete controls so that privacy requests can be handled.

## Functional Requirements

- Show role-appropriate editable profile fields.
- Manage password and MFA where the role supports it.
- Show login history and active sessions.
- Manage connected OAuth providers with recent re-auth where needed.
- Manage notification and marketing preferences.
- Provide data/privacy request entry points according to policy.

## Business Rules And Edge Cases

- Users cannot unlink their last usable sign-in method.
- Security changes require recent authentication where policy requires.
- Staff profile edits may require owner/manager approval for operational fields.
- Marketing opt-out must not block transactional notifications.
- Delete/account closure must respect invoices, audit logs, and legal retention.

## Acceptance Criteria

- Given I change my password, when the change succeeds, then other sessions are revoked according to policy.
- Given I try to unlink my only login method, when I submit, then the action is blocked.
- Given I opt out of marketing, when campaigns are sent, then I am excluded from marketing messages.
- Given I view login history, then recent sign-ins show timestamp, device, and approximate location where available.

## Non-Functional Requirements

- Profile and security changes must be audited.
- PII must be protected and role-scoped.
- Preferences must be SSR-safe and localizable.
