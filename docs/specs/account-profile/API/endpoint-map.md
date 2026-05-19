# Account And Profile API Endpoint Map

**Date:** 2026-05-18
**Status:** Traceability index for project-wide OpenAPI

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

These operations are represented in [Project-Wide Supporting OpenAPI](../../project-wide/API/openapi.yaml). This endpoint map remains the feature traceability index.
