# Business Settings Test Spec

## Backend Unit Tests

- Profile update validates legal name, display name, registration fields, timezone, currency, and tax policy.
- Status transition rejects invalid lifecycle moves.
- Mapper omits internal audit and integration fields.

## Backend Integration Tests

- Owner can update own business settings.
- Cross-business route ID is rejected.
- Registration duplicate returns conflict.
- Audit row and event payload include correlation ID.

## Web Tests

- Profile and policy sections save independently.
- Conflict response preserves unsaved form values.
- Permission denial renders access-denied state.

## Contract Tests

- OpenAPI request and response examples match DTOs.
- Error responses include standardized envelope and correlation ID.
