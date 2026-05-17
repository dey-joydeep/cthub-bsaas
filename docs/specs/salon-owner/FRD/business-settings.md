# Business Settings FRD

**Date:** 2026-05-12
**Status:** Implementation baseline

## Purpose

Define business-level requirements for salon business profile and legal/tax registration management.

## Scope

| Capability                | Requirement                                                                            |
| ------------------------- | -------------------------------------------------------------------------------------- |
| Business profile          | Owner manages display name, legal name, status, and business defaults.                 |
| Legal registration        | Owner manages GST/tax identity, invoice prefix, registered address, and active status. |
| Configuration inheritance | Business defaults are overridden by branch settings where branch override exists.      |
| Audit                     | Business profile and legal/tax changes must be audited.                                |

## Actors

- Owner
- Delegated Branch Manager
- Accountant, read-only
- Platform Admin, support-only

## Business Rules

- A salon business belongs to exactly one tenant.
- A salon business must have at least one owner.
- Legal/tax changes apply only to future finalized invoices.
- Inactivating a salon business must block new branch activity unless an explicit admin transition permits otherwise.
- Accountant can read legal/tax settings but cannot mutate them in MVP.

## Implementation References

- HLD: [Business Settings HLD](../HLD/business-settings.md)
- LLD: [Business Settings LLD](../LLD/business-settings.md)
- Web: [Business Settings Web](../WEB/business-settings.md)
- Validation: [Business Settings Validation](../VALIDATION/business-settings-validation.md)
