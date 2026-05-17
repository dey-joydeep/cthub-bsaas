# Customer CRM Validation

**Date:** 2026-05-12
**Status:** Implementation baseline

## Customer Profile Form

| Property    | Value                                                |
| ----------- | ---------------------------------------------------- |
| Screen ID   | `customers.profile`                                  |
| Form ID     | `customer.profile.upsert`                            |
| Actors      | Owner, Branch Manager, Front Desk, Cashier           |
| Context     | `tenantId`, `salonBusinessId`; `customerId` for edit |
| Operations  | `createCustomer`, `updateCustomer`                   |
| Idempotency | Required for create                                  |

| Field                 | Control     | Default       | Enabled when                     | Client validation         | Backend validation                     | Error key                                          |
| --------------------- | ----------- | ------------- | -------------------------------- | ------------------------- | -------------------------------------- | -------------------------------------------------- |
| `displayName`         | text input  | empty/current | actor can create/update customer | required; 2-120 chars     | required; trimmed                      | `error.customer.profile.display_name.invalid`      |
| `phone`               | tel input   | empty/current | actor can create/update customer | required; max 30 chars    | required; normalized duplicate warning | `error.customer.profile.phone.invalid`             |
| `email`               | email input | empty/current | actor can create/update customer | email format when present | email format; duplicate warning        | `error.customer.profile.email.invalid`             |
| `dateOfBirth`         | date picker | empty/current | actor can create/update customer | not future                | not future                             | `error.customer.profile.date_of_birth.invalid`     |
| `consentForMarketing` | checkbox    | false/current | actor can update consent         | boolean                   | boolean; audit consent change          | `error.customer.profile.marketing_consent.invalid` |

Dependent behavior:

- Duplicate phone/email shows warning and suggested existing profiles.
- Duplicate warning does not auto-merge and does not block unless server policy returns `422`.

## Customer Note Form

| Property    | Value                                                               |
| ----------- | ------------------------------------------------------------------- |
| Screen ID   | `customers.notes`                                                   |
| Form ID     | `customer.note.create`                                              |
| Actors      | Owner, Branch Manager, delegated Front Desk, assigned Service Staff |
| Context     | `tenantId`, `salonBusinessId`, `customerId`                         |
| Operation   | `createCustomerNote`                                                |
| Idempotency | Not required                                                        |

| Field        | Control  | Default         | Enabled when                                 | Client validation      | Backend validation                            | Error key                                |
| ------------ | -------- | --------------- | -------------------------------------------- | ---------------------- | --------------------------------------------- | ---------------------------------------- |
| `body`       | textarea | empty           | actor can create note of selected visibility | required; 1-2000 chars | required; 1-2000 chars; sanitized for display | `error.customer.note.body.invalid`       |
| `visibility` | select   | `STAFF_VISIBLE` | actor can choose visibility                  | enum                   | restricted visibility requires permission     | `error.customer.note.visibility.invalid` |

Permission behavior:

- Restricted note visibility is hidden or disabled for actors without permission.

## Communication Preferences Form

| Property  | Value                                       |
| --------- | ------------------------------------------- |
| Screen ID | `customers.communication_preferences`       |
| Form ID   | `customer.communication_preferences.update` |
| Actors    | Owner, Branch Manager, Front Desk           |
| Context   | `tenantId`, `salonBusinessId`, `customerId` |
| Operation | `updateCustomerCommunicationPreferences`    |

| Field             | Control  | Default       | Enabled when                 | Client validation | Backend validation     | Error key                                     |
| ----------------- | -------- | ------------- | ---------------------------- | ----------------- | ---------------------- | --------------------------------------------- |
| `smsEnabled`      | checkbox | current/false | actor can update preferences | boolean           | boolean; consent audit | `error.customer.preferences.sms.invalid`      |
| `emailEnabled`    | checkbox | current/false | actor can update preferences | boolean           | boolean; consent audit | `error.customer.preferences.email.invalid`    |
| `whatsappEnabled` | checkbox | current/false | actor can update preferences | boolean           | boolean; consent audit | `error.customer.preferences.whatsapp.invalid` |

Test mapping:

- `VAL-CRM-001`: future birth date fails.
- `VAL-CRM-002`: restricted note cannot be created without permission.
- `VAL-CRM-003`: marketing opt-out excludes customer from marketing segments.
