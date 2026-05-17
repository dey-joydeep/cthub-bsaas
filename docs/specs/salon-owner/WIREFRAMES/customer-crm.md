# Customer CRM Wireframes

## Purpose

Define the visual baseline for customer search, profile, notes, consent, visit history, and duplicate merge.

## Source Documents

- [Customer CRM FRD](../FRD/customer-crm.md)
- [Customer CRM HLD](../HLD/customer-crm.md)
- [Customer CRM LLD](../LLD/customer-crm.md)
- [Customer CRM Web LLD](../WEB/customer-crm.md)
- [Customer CRM Validation](../VALIDATION/customer-crm-validation.md)
- [Customer CRM Tests](../TEST/customer-crm.md)
- [API Endpoint Map](../API/endpoint-map.md#customer-crm)
- [Customer Ownership And Merge Draw.io](../../../diagrams/salon-owner/drawio/customer-ownership-merge-flow.drawio)

## Target Penpot Boards

| Screen state   | Board name                          | Purpose                                             |
| -------------- | ----------------------------------- | --------------------------------------------------- |
| Search/profile | `customer-crm.search.desktop`       | Search customers and show selected profile summary. |
| Profile edit   | `customer-crm.profile.desktop`      | Edit profile, notes, preferences, and consent.      |
| Merge dialog   | `customer-crm.merge-dialog.desktop` | Compare duplicate source and target records.        |

## Verified Penpot Board IDs

- `customer-crm.search.desktop`: `a7a9ed20-bb04-8098-8008-08d719d982dd`
- `customer-crm.profile.desktop`: `a7a9ed20-bb04-8098-8008-08d7239c489c`
- `customer-crm.merge-dialog.desktop`: `a7a9ed20-bb04-8098-8008-08d72e32552c`

## Screen Transitions

| From state        | User action     | Target state          | Backend interaction                      |
| ----------------- | --------------- | --------------------- | ---------------------------------------- |
| Search            | Select customer | Profile detail        | `getCustomer`                            |
| Search            | Create customer | Profile edit          | `createCustomer`                         |
| Profile           | Add note        | Notes list updated    | `createCustomerNote`                     |
| Profile           | Update consent  | Consent panel updated | `updateCustomerCommunicationPreferences` |
| Duplicate warning | Review merge    | Merge dialog          | candidate detail query                   |
| Merge dialog      | Merge records   | Target profile        | merge command                            |

## Required States

- no search results;
- duplicate candidate warning;
- sensitive notes hidden by permission;
- consent validation error;
- merge conflict;
- merged target profile;
- server error with correlation ID.
