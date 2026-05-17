# Service Catalog Test Spec

## Backend Unit Tests

- Service validation covers name, category, duration, price, tax, branch availability, and status.
- Price updates create effective price records.
- Archive guard detects future appointment use.

## Backend Integration Tests

- Owner creates category and service.
- Branch-specific availability is enforced.
- Duplicate service name within category returns conflict.
- Existing appointment snapshot survives service price update.

## Web Tests

- Catalog renders grouped categories and services.
- Price input submits decimal string.
- Archive blocker dialog displays future appointment count.

## Contract Tests

- Service create/update payloads match OpenAPI.
- Decimal string examples are valid.
