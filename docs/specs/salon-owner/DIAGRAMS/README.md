# Salon Owner Visual Artifacts

This directory stores Salon Owner visual support files for architecture diagrams and flow diagrams.

Primary written specs remain under [Salon Owner Specs](../README.md).

## Structure

```text
docs/specs/salon-owner/DIAGRAMS/
  README.md
  drawio/
```

## Folder Responsibilities

| Folder    | Responsibility                                                           |
| --------- | ------------------------------------------------------------------------ |
| `drawio/` | Editable draw.io/diagrams.net source diagrams, preferably `.drawio.svg`. |

## Initial Diagram Backlog

| Priority | Diagram                                         | Source docs                                                                        |
| -------- | ----------------------------------------------- | ---------------------------------------------------------------------------------- |
| 1        | Appointment availability and lifecycle sequence | [Appointment FRD](../FRD/appointment.md), [Appointment LLD](../LLD/appointment.md) |
| 2        | POS finalization transaction flow               | [POS FRD](../FRD/pos.md), [POS LLD](../LLD/pos.md)                                 |
| 3        | Inventory stock ledger flow                     | [Inventory FRD](../FRD/inventory.md), [Inventory LLD](../LLD/inventory.md)         |
| 4        | Tenant, business, branch scoping                | [Business Operating Model](../FRD/business-operating-model.md)                     |

## Penpot Status

Penpot is available for screen wireframes through the Penpot MCP plugin when a design file is open and connected.

Current MCP capability check:

- Page: `Page 1`
- Board: `cthub-mcp-capability-check`
- Board ID: `c314af3e-8de0-80bd-8008-0787a44c9b0d`
- Verified capability: create board, create text, create rectangle, export board preview.

Recommended first wireframes:

- appointment calendar and create/edit flow;
- POS checkout and payment flow;
- customer CRM search/profile/merge flow;
- inventory stock balance and adjustment flow.

## Created Artifacts

| Artifact                                       | Location                                                                                                             |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Appointment lifecycle and availability diagram | [drawio/appointment-lifecycle.drawio](./drawio/appointment-lifecycle.drawio)                                         |
| POS finalization transaction diagram           | [drawio/pos-finalization-flow.drawio](./drawio/pos-finalization-flow.drawio)                                         |
| Inventory stock ledger diagram                 | [drawio/inventory-stock-ledger-flow.drawio](./drawio/inventory-stock-ledger-flow.drawio)                             |
| Customer ownership and merge diagram           | [drawio/customer-ownership-merge-flow.drawio](./drawio/customer-ownership-merge-flow.drawio)                         |
| Staff roster conflict diagram                  | [drawio/staff-roster-conflict-flow.drawio](./drawio/staff-roster-conflict-flow.drawio)                               |
| Service pricing and availability diagram       | [drawio/service-catalog-pricing-availability-flow.drawio](./drawio/service-catalog-pricing-availability-flow.drawio) |
| Business/branch scoping and policy diagram     | [drawio/business-branch-scoping-policy-flow.drawio](./drawio/business-branch-scoping-policy-flow.drawio)             |
| Dashboard read model diagram                   | [drawio/dashboard-read-model-flow.drawio](./drawio/dashboard-read-model-flow.drawio)                                 |
| Branch availability invalidation diagram       | [drawio/branch-availability-invalidation-flow.drawio](./drawio/branch-availability-invalidation-flow.drawio)         |
| Appointment calendar wireframe notes           | [../WIREFRAMES/appointment-calendar.md](../WIREFRAMES/appointment-calendar.md)                                       |
