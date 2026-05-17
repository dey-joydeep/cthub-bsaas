# Account And Profile API Endpoint Map

**Date:** 2026-05-18
**Status:** Target planning contract

| Capability | Method | Path | Operation ID | Notes |
| --- | --- | --- | --- | --- |
| Get my profile | `GET` | `/me/profile` | `getMyProfile` | User-scoped profile and editable field metadata. |
| Update my profile | `PATCH` | `/me/profile` | `updateMyProfile` | Field-level authorization required. |
| Get security summary | `GET` | `/me/security/summary` | `getMySecuritySummary` | Aggregates Auth state. |
| Update locale | `PATCH` | `/me/preferences/locale` | `updateMyLocalePreference` | Used by app shell. |
| Update communication preferences | `PATCH` | `/me/preferences/communication` | `updateMyCommunicationPreferences` | Must preserve transactional messages. |
| List connected accounts | `GET` | `/me/connected-accounts` | `listMyConnectedAccounts` | Customer social providers. |
| Unlink connected account | `POST` | `/me/connected-accounts/{provider}/unlink` | `unlinkMyConnectedAccount` | Must not remove last sign-in method. |
| Create privacy request | `POST` | `/me/privacy-requests` | `createMyPrivacyRequest` | Export/delete request entry point. |
| List privacy requests | `GET` | `/me/privacy-requests` | `listMyPrivacyRequests` | Request status history. |

## OpenAPI Rule

Final implementation must either add these operations to an account/profile OpenAPI contract or reconcile them into existing Auth/User contracts before coding.
