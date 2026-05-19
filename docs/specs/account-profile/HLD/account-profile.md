# Account And Profile HLD

**Date:** 2026-05-18
**Status:** Current planning baseline

## Boundary

Account/profile owns user-facing identity and preference management. Auth remains the source of truth for credentials, sessions, MFA, passkeys, recovery codes, and OAuth provider security operations.

## Bounded Contexts

| Context | Responsibility |
| --- | --- |
| Account Profile | Display profile, editable identity fields, preferences, privacy entry points. |
| Auth | Passwords, sessions, MFA, passkeys, recovery codes, OAuth linking/unlinking security checks. |
| Notifications | Communication preferences and delivery channel rules. |
| Privacy/Governance | Data export/delete requests and retention rules. |
| Staff Management | Operational staff fields such as skills, branch assignment, schedule, and roles. |

## Data Ownership

- `User` account data is user-scoped.
- Customer profile data may be salon-business-owned and must not be merged across businesses without explicit future rules.
- Staff operational profile data is business/branch-scoped.
- Preferences are user-scoped unless the preference is consent for a specific salon business.

## Integration Points

| Integration | Use |
| --- | --- |
| Auth API | Password, sessions, MFA, passkeys, recovery codes, OAuth provider operations. |
| Notification preferences | Channel preference updates. |
| Privacy request workflow | Export/delete request creation and status. |
| Audit logging | Identity, security, consent, and privacy changes. |

## Diagram

See [account-profile-security-flow.drawio](../DIAGRAMS/account-profile-security-flow.drawio).
