# Integrations API Endpoint Map

**Date:** 2026-05-18
**Status:** Target planning contract

| Capability | Method | Path | Operation ID |
| --- | --- | --- | --- |
| List providers | `GET` | `/partner/integrations/providers` | `listIntegrationProviders` |
| Configure provider | `PUT` | `/partner/integrations/providers/{provider}` | `configureIntegrationProvider` |
| Test provider | `POST` | `/partner/integrations/providers/{provider}/test` | `testIntegrationProvider` |
| Integration health | `GET` | `/partner/integrations/health` | `getIntegrationHealth` |
| Provider webhook | `POST` | `/integrations/webhooks/{provider}` | `handleProviderWebhook` |
| Platform provider status | `GET` | `/admin/platform/integrations/health` | `getPlatformIntegrationHealth` |
