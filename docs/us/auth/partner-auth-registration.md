# Partner Owner And Staff Onboarding User Stories

**Date:** 2026-05-11
**Status:** Current supporting source

## Owner Outcome

As a salon owner or staff member, I want a secure onboarding flow so that Partner app access is granted only to invited and MFA-ready users.

## Actors

- Salon Owner
- Staff
- Platform Admin
- Branch Manager

## User Stories

### PREG-US-001: Owner onboarding link

As a salon owner, I want to complete onboarding from a secure single-use link so that my salon account can be activated safely.

### PREG-US-002: Staff invite

As staff, I want to accept an invitation and rotate my temporary password so that I can access only my assigned salon/branch role.

### PREG-US-003: MFA gate

As a salon business, I want owner and staff access blocked until required MFA enrollment is complete so that operational data is protected.

### PREG-US-004: MFA reminders

As a salon owner, I want reminder emails while MFA is incomplete so that onboarding does not stall silently.

## Functional Requirements

- Owner onboarding link is single-use and expires according to policy.
- Staff invite binds user to salon, branch, and role.
- Staff temporary password must be rotated before access.
- API returns `isMFAEnrollRequired` when MFA enrollment must be completed.
- Partner UI blocks operational access while MFA gate is active.
- Reminder scheduler sends reminders every two days while MFA is required.

## Business Rules And Edge Cases

- Expired or used links cannot be reused.
- Wrong temporary password is rate-limited.
- New password cannot equal temporary password.
- User signing out before MFA completion must resume at MFA enrollment after next sign-in.
- Owner/Staff records remain auditable even if onboarding expires.

## Acceptance Criteria

- Given an owner opens a valid onboarding link, when they set password, then MFA enrollment is required before Partner UI access.
- Given staff enters valid temporary password and new password, when the password is rotated, then MFA enrollment is required before access.
- Given onboarding link is expired, when user opens it, then the system shows an expired-link outcome.
- Given MFA remains incomplete for two days, when reminder scheduler runs, then a reminder is sent and timestamp is updated.
