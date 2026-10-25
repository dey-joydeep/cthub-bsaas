# Integrations API Endpoint Map

**Date:** 2026-05-18
**Status:** Traceability index for project-wide OpenAPI

These operations are represented in [Project-Wide Supporting OpenAPI](../../project-wide/API/openapi.yaml). This endpoint map remains the feature traceability index.

| Capability               | Method | Path                                              | Operation ID                   |
| ------------------------ | ------ | ------------------------------------------------- | ------------------------------ |
| List providers           | `GET`  | `/partner/integrations/providers`                 | `listIntegrationProviders`     |
| Configure provider       | `PUT`  | `/partner/integrations/providers/{provider}`      | `configureIntegrationProvider` |
| Test provider            | `POST` | `/partner/integrations/providers/{provider}/test` | `testIntegrationProvider`      |
| Integration health       | `GET`  | `/partner/integrations/health`                    | `getIntegrationHealth`         |
| Provider webhook         | `POST` | `/integrations/webhooks/{provider}`               | `handleProviderWebhook`        |
| Platform provider status | `GET`  | `/admin/platform/integrations/health`             | `getPlatformIntegrationHealth` |
