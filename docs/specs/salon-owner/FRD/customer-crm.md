# Customer CRM FRD

**Date:** 2026-05-12
**Status:** Implementation baseline

## Purpose

Define customer profile, notes, visit history, and communication preference requirements.

## Scope

| Capability                | Requirement                                                          |
| ------------------------- | -------------------------------------------------------------------- |
| Customer profile          | Create/search/update business-scoped customer records.               |
| Notes                     | Store staff-visible and restricted customer notes.                   |
| Visit history             | Show visits and invoices across branches in the same salon business. |
| Communication preferences | Record marketing/transactional channel preferences.                  |

## Actors

- Owner
- Branch Manager
- Front Desk
- Service Staff, assigned/limited access
- Cashier

## Business Rules

- Customer profile belongs to one salon business and can have visits across branches of that business.
- Customer can exist without an application login identity.
- Duplicate phone/email detection warns users but must not auto-merge records.
- Restricted notes require explicit role permission.
- Marketing messages must respect channel-level opt-out.
- Transactional reminders can be sent when legally allowed even if marketing opt-out is enabled.

## Implementation References

- HLD: [Customer CRM HLD](../HLD/customer-crm.md)
- LLD: [Customer CRM LLD](../LLD/customer-crm.md)
- Web: [Customer CRM Web](../WEB/customer-crm.md)
- Validation: [Customer CRM Validation](../VALIDATION/customer-crm-validation.md)
