# Account And Profile LLD

**Date:** 2026-05-18
**Status:** Current planning baseline

## Suggested Modules

| Module | Responsibility |
| --- | --- |
| `server-feature-account-profile` | Profile and preference use cases. |
| `server-contracts-account-profile` | Account/profile ports and DTO contracts. |
| `web-core-account-profile` | API services, guards, account/profile state. |
| `web-ui-account-profile` | Reusable profile and preference components. |

## Commands And Queries

| Operation | Type | Notes |
| --- | --- | --- |
| `getMyProfile` | Query | Returns role-aware editable and readonly fields. |
| `updateMyProfile` | Command | Updates allowed profile fields and writes audit record. |
| `getMySecuritySummary` | Query | Aggregates Auth security state without exposing secrets. |
| `updateMyCommunicationPreferences` | Command | Updates notification preferences and consent references. |
| `createMyPrivacyRequest` | Command | Creates export/delete request for privacy workflow. |
| `unlinkMySocialProvider` | Command | Delegates last-sign-in-method safety check to Auth. |

## Transaction Rules

- Profile update and audit record must commit together.
- Preference update and audit record must commit together when consent changes.
- Privacy request creation must be idempotent by request type while pending.

## Error Mapping

| Error | HTTP | Key |
| --- | --- | --- |
| Last sign-in method | `409` | `account_profile.error.last_sign_in_method` |
| Reauth required | `403` | `account_profile.error.reauth_required` |
| Field forbidden | `403` | `account_profile.error.field_forbidden` |
| Privacy request duplicate | `409` | `account_profile.error.privacy_request_pending` |

## Test Implications

Implementation must test field-level authorization, session/security delegation, audit creation, preference persistence, and privacy request idempotency.
