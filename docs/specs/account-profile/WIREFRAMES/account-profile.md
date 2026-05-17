# Account And Profile Wireframes

**Date:** 2026-05-18
**Status:** Wireframe specification pending live Penpot board

## Penpot Status

Live Penpot board creation is pending. First MCP attempt on 2026-05-18 failed with a transport/deserialization error.

## Required Frames

| Frame ID | Purpose |
| --- | --- |
| `account-profile.profile.desktop` | Profile details with editable and readonly fields. |
| `account-profile.security.desktop` | Security dashboard with password, MFA, sessions, passkeys. |
| `account-profile.connected-accounts.desktop` | Provider list and unlink conflict. |
| `account-profile.preferences.desktop` | Communication and locale preferences. |
| `account-profile.privacy.desktop` | Export/delete request entry and status. |
| `account-profile.mobile` | Mobile stacked account settings navigation. |

## Required States

- loading;
- save success;
- validation error;
- recent-auth required;
- last sign-in method conflict;
- privacy confirmation.
