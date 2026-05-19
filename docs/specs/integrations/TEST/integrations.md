# Integrations Test Specification

**Date:** 2026-05-18
**Status:** Current planning baseline

## Required Tests

- Provider config rejects missing credentials.
- Saved provider config never returns raw secret.
- Webhook rejects invalid signature.
- Duplicate webhook event is idempotent.
- Payment retry requires idempotency protection.
- Provider outage surfaces health error without leaking secrets.
