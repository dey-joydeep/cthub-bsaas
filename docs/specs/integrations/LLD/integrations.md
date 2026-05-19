# Integrations LLD

**Date:** 2026-05-18
**Status:** Current planning baseline

## Commands And Queries

| Operation | Type | Notes |
| --- | --- | --- |
| `listIntegrationProviders` | Query | Providers available by environment and scope. |
| `configureIntegrationProvider` | Command | Stores config through secret-safe path. |
| `testIntegrationProvider` | Command | Sends safe test call. |
| `handleProviderWebhook` | Command | Validates signature and dispatches event. |
| `getIntegrationHealth` | Query | Provider status and recent failures. |

## Webhook Rules

- Verify signature before parsing business action.
- Use idempotency key or provider event ID.
- Store raw payload only when safe and redacted.
- Return provider-appropriate status codes.

## Test Implications

Tests must cover signature validation, idempotent webhook handling, provider failure mapping, secret redaction, and retry safety.
