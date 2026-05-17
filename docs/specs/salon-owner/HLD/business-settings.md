# Business Settings HLD

## Purpose

Business Settings defines the tenant-level profile, registration, timezone, currency, and policy defaults used by every branch and operational workflow.

## Architecture Scope

- Owns the `Business` aggregate and tenant-level policy configuration.
- Provides read-through context to branch, staff, customer, appointment, POS, inventory, and dashboard flows.
- Enforces owner-only mutation except for platform-admin maintenance operations outside this domain.

## Dependencies

- Authentication supplies the authenticated partner user and active business context.
- Authorization verifies owner or delegated admin access before mutation.
- Audit logging records all profile, tax, currency, timezone, and policy changes.

## Data Ownership

- `Business` stores legal name, display name, registration identifiers, operating country, timezone, default currency, tax policy, and lifecycle status.
- Business-level settings are not duplicated into branch records except for immutable historical snapshots required by invoices and reports.

## Integration Points

- API operations are listed in [API endpoint map](../API/endpoint-map.md#business-settings).
- Detailed commands and transactions are defined in [Business Settings LLD](../LLD/business-settings.md).
- Screen behavior is defined in [Business Settings Web LLD](../WEB/business-settings.md).
- Validation rules are defined in [Business Settings Validation](../VALIDATION/business-settings-validation.md).

## Events

- `BusinessProfileUpdated`
- `BusinessPolicyUpdated`
- `BusinessStatusChanged`

Events are emitted after the transaction commits and include business ID, actor ID, changed field names, and correlation ID.

## Security And Consistency

- Business ID is always derived from authenticated context or verified route scope.
- Server logic rejects cross-business updates even when a valid UUID is supplied.
- Settings changes that affect invoices or reports are effective from the next operational action; historical records retain their original snapshots.
