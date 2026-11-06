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
- For the implemented salon-owner settings service, a migration-backed PostgreSQL test checks that the idempotency partial index exists, an owner cannot read another tenant's business, concurrent same-key requests persist one business and audit record even with different names, and a changed payload conflicts. The changed-payload test synchronizes both transactions after their replay reads to exercise the unique-index race. These service tests do not verify sign-in claim production or HTTP guard routing.

## Web Tests

- Profile and policy sections save independently.
- Conflict response preserves unsaved form values.
- Permission denial renders access-denied state.

## Contract Tests

- OpenAPI request and response examples match DTOs.
- Error responses include standardized envelope and correlation ID.
