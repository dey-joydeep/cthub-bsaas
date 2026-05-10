# Partner Authentication User Stories

**Date:** 2026-05-11
**Status:** Current supporting source

## Owner Outcome

As a salon owner or staff member, I want secure but practical sign-in, MFA, session visibility, and recovery so that daily salon operations continue without exposing business data.

## Actors

- Salon Owner
- Staff
- Branch Manager

## User Stories

### PAUTH-US-001: Partner sign-in

As a Partner user, I want to sign in with approved credentials so that I can access my assigned salon or branch workspace.

### PAUTH-US-002: MFA enrollment and verification

As a Partner user, I want to enroll and verify passkey or TOTP so that my account satisfies salon security policy.

### PAUTH-US-003: Tenant-scoped sessions

As a salon owner, I want sessions scoped to my salon/branch permissions so that staff cannot cross tenant boundaries.

### PAUTH-US-004: Staff session oversight

As a salon owner or authorized manager, I want to revoke staff sessions so that access can be removed from lost/shared devices.

### PAUTH-US-005: Partner recovery

As a Partner user, I want a safe password reset/recovery path so that I can regain access without weakening security.

## Functional Requirements

- Partner sign-in uses secure cookies and CSRF protection.
- Required MFA must be satisfied before operational Partner screens are accessible.
- Session list shows device, user agent, approximate IP/location where available, last seen, and created time.
- Authorized owner/manager can revoke staff sessions within their salon scope.
- Password reset follows generic response and session revocation policy.

## Business Rules And Edge Cases

- Partner access is denied while `isMFAEnrollRequired` is true.
- Staff cannot revoke owner sessions unless explicitly permitted.
- Revoking a session invalidates its refresh path.
- Tenant and role authorization are enforced server-side.
- Recovery code or manual verification policy applies when MFA is unavailable.

## Acceptance Criteria

- Given a Partner user without required MFA, when sign-in succeeds, then they are routed to MFA enrollment and cannot access operations.
- Given an owner revokes a staff session, when that session refreshes, then refresh fails.
- Given a staff user belongs to one branch, when accessing another branch, then access is denied.
- Given password reset succeeds, then other sessions are revoked according to policy.
