# Integrations Web Specification

**Date:** 2026-05-18
**Status:** Current planning baseline

## Routes

| Route | Screen ID |
| --- | --- |
| `/partner/settings/integrations` | `integrations.providers` |
| `/partner/settings/integrations/:provider` | `integrations.providerDetail` |
| `/admin/platform/integrations` | `integrations.platformHealth` |

## Screen Requirements

- Provider list must show configured/unconfigured/error states.
- Provider detail must hide secrets after save.
- Test action must show provider-safe result and correlation ID.
- Health screen must show recent failures and retry status.
