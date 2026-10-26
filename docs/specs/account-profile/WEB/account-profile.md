# Account And Profile Web Specification

**Date:** 2026-05-18
**Status:** Current planning baseline

## Routes

| Route                         | Screen ID                   | Actors                                |
| ----------------------------- | --------------------------- | ------------------------------------- |
| `/account/profile`            | `account.profile`           | Authenticated users                   |
| `/account/security`           | `account.security`          | Authenticated users                   |
| `/account/connected-accounts` | `account.connectedAccounts` | Customer, where providers are enabled |
| `/account/preferences`        | `account.preferences`       | Authenticated users                   |
| `/account/privacy`            | `account.privacy`           | Authenticated users                   |

## Screen Behavior

| Screen             | Requirements                                                                                         |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| Profile            | Editable allowed fields, readonly operational fields, save/discard, audit-sensitive success message. |
| Security           | Password, MFA, passkeys, sessions, recovery codes through Auth-backed components.                    |
| Connected accounts | Provider list, link/unlink, last-method protection.                                                  |
| Preferences        | Locale, timezone, communication channels, marketing opt-out.                                         |
| Privacy            | Export/delete request entry and request status.                                                      |

## State Requirements

- Show field-level disabled reasons where a field is visible but not editable.
- Security operations requiring recent authentication must show reauth prompt.
- Connected-account unlink conflict must explain that another sign-in method is required.
- Privacy destructive action must use confirmation and must not imply immediate deletion when governance review is required.

## Accessibility

Forms must include error summary after submit, labels for all controls, focus return from dialogs, and keyboard-operable provider actions.
