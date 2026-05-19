# Customer CRM LLD

## Backend Components

Visual flow reference:

- [Customer Ownership And Merge Draw.io](../DIAGRAMS/drawio/customer-ownership-merge-flow.drawio)

- `CustomerController`
- `CustomerService`
- `CustomerRepositoryPort`
- `CustomerConsentRepositoryPort`
- `CustomerMergePort`
- `CustomerAuditPort`

## Commands And Queries

- `SearchCustomersQuery`
- `GetCustomerProfileQuery`
- `CreateCustomerCommand`
- `UpdateCustomerProfileCommand`
- `UpdateCustomerConsentCommand`
- `AddCustomerNoteCommand`
- `MergeCustomersCommand`

## Transaction Rules

- Customer profile writes and consent changes create audit entries.
- Merge moves appointments, invoices, notes, tags, and visit references in one transaction.
- Merge records source and target IDs for audit and recovery.

## Validation Mapping

- DTO validation maps to [Customer CRM Validation](../VALIDATION/customer-crm-validation.md).
- Service validation verifies business scope, duplicate candidates, consent legality, sensitive-note permission, and merge eligibility.

## Error Mapping

- `CUSTOMER_NOT_FOUND` returns `404`.
- `CUSTOMER_DUPLICATE_CONFLICT` returns `409`.
- `CUSTOMER_MERGE_INVALID` returns `409`.
- `CUSTOMER_NOTE_PERMISSION_DENIED` returns `403`.
- `CUSTOMER_VALIDATION_FAILED` returns `400`.

## Implementation Notes

- Customer identity is business-scoped.
- Phone and email are normalized for search and duplicate detection.
- Consent data includes source, actor, timestamp, channel, and policy version.
