# Customer CRM Web LLD

## Route And Screen

- Route: `/owner/customers`
- Primary screens: customer search, profile, visit history, notes, consent, duplicate merge.
- Wireframes: [Customer CRM Wireframes](../WIREFRAMES/customer-crm.md).

## User Goals

- Staff finds or creates customer records quickly.
- Owner and manager review customer history across branches.
- Authorized users manage consent and merge duplicates.

## Components

- `CustomerSearchPage`
- `CustomerProfileForm`
- `CustomerVisitHistory`
- `CustomerConsentPanel`
- `CustomerNotesPanel`
- `CustomerMergeDialog`

## State And Data

- Search uses debounced server query with business scope.
- Profile view loads customer details, consent, visit summary, and notes by permission.
- Merge dialog loads candidate details before confirmation.

## Controls And Validation

- Exact control behavior is defined in [Customer CRM Validation](../VALIDATION/customer-crm-validation.md).
- Sensitive notes are hidden unless the actor has permission.
- Consent controls display policy version and source.

## Error Handling

- Duplicate warnings are non-blocking during create and blocking during merge.
- Merge conflicts keep both source and target visible.
- Consent errors attach to the channel-specific control.

## Accessibility

- Search results expose customer name, phone, email, and last visit.
- Merge comparison table uses row and column headers for each compared field.
