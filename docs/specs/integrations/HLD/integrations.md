# Integrations HLD

**Date:** 2026-05-18
**Status:** Current planning baseline

## Boundary

Integrations owns provider configuration, provider adapters, webhook entry points, health/status, and provider-safe DTO mapping. Business features own the business decision to call an integration.

## Provider Port Pattern

| Port                   | Example adapters                        |
| ---------------------- | --------------------------------------- |
| `PaymentProviderPort`  | Razorpay, Stripe, manual UPI reference. |
| `MessageProviderPort`  | WhatsApp, SMS.                          |
| `EmailProviderPort`    | SMTP, transactional email provider.     |
| `MapProviderPort`      | Maps/geocoding provider.                |
| `CalendarExportPort`   | ICS export, calendar deep links.        |
| `IdentityProviderPort` | OAuth/OIDC providers.                   |

## Diagram

See [integration-provider-flow.drawio](../DIAGRAMS/integration-provider-flow.drawio).
