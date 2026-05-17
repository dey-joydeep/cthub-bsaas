# Customer CRM Test Spec

## Backend Unit Tests

- Customer profile validation covers name, contact, birth date, tags, consent, and notes.
- Duplicate detection normalizes phone and email.
- Merge validates target/source business scope.

## Backend Integration Tests

- Customer profile belongs to one business.
- Customer can have visits across branches of the same business.
- Same person can exist in two businesses.
- Merge moves appointments, invoices, notes, and consent audit history.

## Web Tests

- Search debounces and shows scoped results.
- Sensitive notes hide without permission.
- Merge comparison keeps source and target visible after conflict.

## Contract Tests

- Consent update schema includes policy version and channel.
- Merge response includes target customer ID and moved record counts.
