# Admin Authentication User Stories

**Date:** 2026-05-11
**Status:** Current supporting source

## Owner Outcome

As a platform admin, I want phishing-resistant authentication, step-up controls, and strict session governance so that high-risk platform operations remain protected.

## Actors

- Platform Admin
- Support Admin

## User Stories

### AAUTH-US-001: Mandatory MFA

As a platform admin, I want MFA required before dashboard access so that admin compromise risk is reduced.

### AAUTH-US-002: Passkey sign-in

As a platform admin, I want passkey sign-in where supported so that phishing-resistant authentication is available.

### AAUTH-US-003: Step-up authentication

As a platform admin, I want high-risk actions to require recent re-authentication so that stale sessions cannot perform dangerous operations.

### AAUTH-US-004: Admin session control

As a platform admin, I want active session visibility and remote logout so that lost or shared devices can be handled quickly.

### AAUTH-US-005: Admin abuse controls

As a platform operator, I want rate limiting and security alerts for admin auth failures so that attacks are detected early.

## Functional Requirements

- Admin MFA is mandatory using passkey or TOTP according to policy.
- Recovery codes are issued and shown once during MFA enrollment.
- Step-up applies to tenant deletion, role elevation, policy changes, support access, and other high-risk actions.
- Admin session list shows device, user agent, approximate IP/location where available, last seen, and created time.
- Auth failures are rate-limited and audited.

## Business Rules And Edge Cases

- Admin cannot access dashboard before MFA enrollment.
- Step-up has a short validity window.
- Recovery code use must rotate or invalidate the used code.
- Admin auth logs must avoid secrets and raw tokens.
- Support admins may have reduced permissions compared with platform owners.

## Acceptance Criteria

- Given an admin without MFA, when sign-in succeeds, then MFA enrollment is required before dashboard access.
- Given admin performs a high-risk action, when recent step-up is missing, then re-authentication is required.
- Given admin revokes another session, when that session refreshes, then refresh fails.
- Given repeated admin login failures occur, then throttling and audit events are produced.
