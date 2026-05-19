# Business Settings LLD

## Backend Components

Visual flow reference:

- [Business/Branch Scoping And Policy Draw.io](../DIAGRAMS/drawio/business-branch-scoping-policy-flow.drawio)

- `BusinessSettingsController`
- `BusinessSettingsService`
- `BusinessRepositoryPort`
- `BusinessPolicyRepositoryPort`
- `BusinessAuditPort`

## Commands And Queries

- `GetBusinessSettingsQuery`
- `UpdateBusinessProfileCommand`
- `UpdateBusinessPolicyCommand`
- `ChangeBusinessStatusCommand`

## Transaction Rules

- Profile and policy updates run in one transaction per request.
- Audit entry creation is part of the same transaction.
- Events are published after commit.

## Validation Mapping

- DTO validation maps to [Business Settings Validation](../VALIDATION/business-settings-validation.md).
- Service validation verifies business ownership, registration uniqueness, supported currency, supported timezone, and status transition legality.

## Error Mapping

- `BUSINESS_NOT_FOUND` returns `404`.
- `BUSINESS_SCOPE_MISMATCH` returns `403`.
- `BUSINESS_REGISTRATION_DUPLICATE` returns `409`.
- `BUSINESS_STATUS_TRANSITION_INVALID` returns `409`.
- `BUSINESS_SETTINGS_VALIDATION_FAILED` returns `400`.

## Implementation Notes

- Never accept business ID from request body.
- Route business ID is checked against authenticated context.
- Response DTO omits internal audit fields and secret integration settings.
