# Customer CRM HLD

## Purpose

Customer CRM manages business-owned customer profiles, consent, preferences, visit history, and customer notes.

## Architecture Scope

- Owns customer profile, branch visit history linkage, tags, notes, preferences, and consent state.
- Supports duplicate detection inside one salon business.
- Supplies customer context to appointments, POS, and dashboard views.

## Dependencies

- Business Settings provides consent and retention policy defaults.
- Appointment and POS contribute visit and purchase history.
- Auth integration is optional for customer-facing accounts and remains separate from business-owned CRM identity.

## Data Ownership

- Customer profile belongs to one salon business and can have visits across branches of that business.
- The same person can exist as separate customer records under different salon businesses.
- Consent state is business-specific and cannot be shared across tenants.

## Integration Points

- API operations are listed in [API endpoint map](../API/endpoint-map.md#customer-crm).
- Detailed commands and transactions are defined in [Customer CRM LLD](../LLD/customer-crm.md).
- Screen behavior is defined in [Customer CRM Web LLD](../WEB/customer-crm.md).
- Validation rules are defined in [Customer CRM Validation](../VALIDATION/customer-crm-validation.md).

## Events

- `CustomerCreated`
- `CustomerUpdated`
- `CustomerMerged`
- `CustomerConsentUpdated`
- `CustomerNoteAdded`

## Security And Consistency

- Customer access is scoped by business and branch permission.
- Sensitive notes require elevated permission and audit logging.
- Merge operations preserve appointment, invoice, and consent audit history.
