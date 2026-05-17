# Branch Settings Wireframes

## Purpose

Define the visual baseline for branch profile, hours, holidays, branch policy, and archive blockers.

## Source Documents

- [Branch Settings FRD](../FRD/branch-settings.md)
- [Branch Settings HLD](../HLD/branch-settings.md)
- [Branch Settings LLD](../LLD/branch-settings.md)
- [Branch Settings Web LLD](../WEB/branch-settings.md)
- [Branch Settings Validation](../VALIDATION/branch-settings-validation.md)
- [Branch Settings Tests](../TEST/branch-settings.md)
- [API Endpoint Map](../API/endpoint-map.md#branch-settings)
- [Branch Availability Invalidation Draw.io](../../../diagrams/salon-owner/drawio/branch-availability-invalidation-flow.drawio)

## Target Penpot Boards

| Screen state       | Board name                                 | Purpose                                     |
| ------------------ | ------------------------------------------ | ------------------------------------------- |
| Profile and hours  | `branch-settings.profile-hours.desktop`    | Branch details and weekly hours.            |
| Holiday and policy | `branch-settings.holiday-policy.desktop`   | Holiday calendar and policy overrides.      |
| Archive conflict   | `branch-settings.archive-conflict.desktop` | Future appointment blockers before archive. |

## Verified Penpot Board IDs

- `branch-settings.profile-hours.desktop`: `a7a9ed20-bb04-8098-8008-08d893f3ceac`
- `branch-settings.holiday-policy.desktop`: `a7a9ed20-bb04-8098-8008-08d8a6b2f076`
- `branch-settings.archive-conflict.desktop`: `a7a9ed20-bb04-8098-8008-08d8b79b8ce3`

## Required States

- branch list empty;
- hours overlap validation;
- holiday closed/open override;
- branch manager limited permission;
- archive conflict with future appointment count;
- successful availability invalidation.
