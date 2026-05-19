# Business Settings Wireframes

## Purpose

Define the visual baseline for business profile, legal registration, tenant defaults, lifecycle status, and audit history.

## Source Documents

- [Business Settings FRD](../FRD/business-settings.md)
- [Business Settings HLD](../HLD/business-settings.md)
- [Business Settings LLD](../LLD/business-settings.md)
- [Business Settings Web LLD](../WEB/business-settings.md)
- [Business Settings Validation](../VALIDATION/business-settings-validation.md)
- [Business Settings Tests](../TEST/business-settings.md)
- [API Endpoint Map](../API/endpoint-map.md#business-settings)
- [Business/Branch Scoping Draw.io](../DIAGRAMS/drawio/business-branch-scoping-policy-flow.drawio)

## Target Penpot Boards

| Screen state       | Board name                                 | Purpose                                |
| ------------------ | ------------------------------------------ | -------------------------------------- |
| Profile and policy | `business-settings.profile-policy.desktop` | Business profile and default policies. |
| Audit and status   | `business-settings.audit-status.desktop`   | Lifecycle status and audit timeline.   |

## Verified Penpot Board IDs

- `business-settings.profile-policy.desktop`: `a7a9ed20-bb04-8098-8008-08d91d69dced`
- `business-settings.audit-status.desktop`: `a7a9ed20-bb04-8098-8008-08d931f89bb8`

## Required States

- owner-only editable profile;
- invalid registration identifier;
- duplicate registration conflict;
- unsupported timezone/currency;
- status transition conflict;
- audit timeline readonly state.
