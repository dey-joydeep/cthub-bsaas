# Integrations Validation And Controls

**Date:** 2026-05-18
**Status:** Current planning baseline

| Rule ID | Field | Rule | Error key |
| --- | --- | --- | --- |
| INT-VAL-001 | `provider` | Must be supported in current environment. | `integrations.validation.provider_unsupported` |
| INT-VAL-002 | `credentials` | Required fields depend on provider; never echoed after save. | `integrations.validation.credentials_invalid` |
| INT-VAL-003 | `webhookSignature` | Must validate before processing. | `integrations.validation.webhook_signature_invalid` |
| INT-VAL-004 | `scope` | Must be platform, business, or branch according to provider definition. | `integrations.validation.scope_invalid` |
| INT-VAL-005 | `idempotencyKey` | Required for payment capture and webhook processing. | `integrations.validation.idempotency_key_required` |
