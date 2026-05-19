# Service Catalog Wireframes

## Purpose

Define the visual baseline for service categories, services, pricing, branch availability, staff eligibility, and archive conflict.

## Source Documents

- [Service Catalog FRD](../FRD/service-catalog.md)
- [Service Catalog HLD](../HLD/service-catalog.md)
- [Service Catalog LLD](../LLD/service-catalog.md)
- [Service Catalog Web LLD](../WEB/service-catalog.md)
- [Service Catalog Validation](../VALIDATION/service-catalog-validation.md)
- [Service Catalog Tests](../TEST/service-catalog.md)
- [API Endpoint Map](../API/endpoint-map.md#service-catalog)
- [Service Catalog Draw.io](../DIAGRAMS/drawio/service-catalog-pricing-availability-flow.drawio)

## Target Penpot Boards

| Screen state        | Board name                                 | Purpose                                       |
| ------------------- | ------------------------------------------ | --------------------------------------------- |
| List and editor     | `service-catalog.list-editor.desktop`      | Category/service list with editor panel.      |
| Branch availability | `service-catalog.availability.desktop`     | Branch pricing and eligible staff assignment. |
| Archive conflict    | `service-catalog.archive-conflict.desktop` | Future appointment blockers before archiving. |

## Verified Penpot Board IDs

- `service-catalog.list-editor.desktop`: `a7a9ed20-bb04-8098-8008-08d84526ed69`
- `service-catalog.availability.desktop`: `a7a9ed20-bb04-8098-8008-08d850c285ee`
- `service-catalog.archive-conflict.desktop`: `a7a9ed20-bb04-8098-8008-08d86353c453`

## Required States

- empty category;
- active and archived services;
- duplicate service name;
- invalid price or duration;
- future appointment archive conflict;
- successful branch availability save.
