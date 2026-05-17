# Branch Settings FRD

**Date:** 2026-05-12
**Status:** Implementation baseline

## Purpose

Define business requirements for branch profile, hours, holidays, and policies.

## Scope

| Capability            | Requirement                                                                  |
| --------------------- | ---------------------------------------------------------------------------- |
| Branch profile        | Manage branch name, contact, address, timezone, currency, and active status. |
| Weekly hours          | Define weekly operating intervals per branch.                                |
| Holidays/special days | Override weekly hours for date-specific closures or special hours.           |
| Branch policy         | Configure booking lead time, cancellation cutoff, and no-show grace.         |

## Actors

- Owner
- Branch Manager
- Accountant, read-only for tax/payment-related branch views
- Platform Admin, support-only

## Business Rules

- A branch belongs to exactly one salon business.
- Inactive branches must not accept new appointments, walk-ins, invoices, or stock movements except corrective/admin operations.
- Holiday/special-day rules override weekly hours.
- Hours, holiday, and policy changes must not silently mutate existing appointments.
- Branch policy changes apply to future operations unless explicitly reapplied with audit.

## Implementation References

- HLD: [Branch Settings HLD](../HLD/branch-settings.md)
- LLD: [Branch Settings LLD](../LLD/branch-settings.md)
- Web: [Branch Settings Web](../WEB/branch-settings.md)
- Validation: [Branch Settings Validation](../VALIDATION/branch-settings-validation.md)
