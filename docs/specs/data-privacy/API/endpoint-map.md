# Data Privacy And Governance API Endpoint Map

**Date:** 2026-05-18
**Status:** Traceability index for project-wide OpenAPI

These operations are represented in [Project-Wide Supporting OpenAPI](../../project-wide/API/openapi.yaml). This endpoint map remains the feature traceability index.

| Capability | Method | Path | Operation ID |
| --- | --- | --- | --- |
| Create my privacy request | `POST` | `/me/privacy-requests` | `createMyPrivacyRequest` |
| List my privacy requests | `GET` | `/me/privacy-requests` | `listMyPrivacyRequests` |
| Create business export | `POST` | `/partner/data-exports` | `createBusinessDataExport` |
| Export status | `GET` | `/partner/data-exports/{id}` | `getBusinessDataExportStatus` |
| Merge customer profiles | `POST` | `/partner/customers/merge` | `mergeCustomerProfiles` |
| Access restricted note | `POST` | `/partner/customers/{id}/restricted-notes/access` | `accessRestrictedCustomerNote` |
| Admin privacy queue | `GET` | `/admin/platform/privacy-requests` | `listPlatformPrivacyRequests` |
| Review privacy request | `POST` | `/admin/platform/privacy-requests/{id}/review` | `reviewPlatformPrivacyRequest` |
