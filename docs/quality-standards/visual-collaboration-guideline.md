# Visual Collaboration Guideline

**Date:** 2026-05-12
**Status:** Active standard

## Purpose

Define how this project uses Penpot and draw.io/diagrams.net to make requirements, architecture, and implementation documents easier to understand without moving the source of truth away from Markdown and OpenAPI.

This guideline applies to production documentation under `docs/us/**`, `docs/specs/**`, `docs/infra-upgrade/**`, and `docs/status/**` when visual artifacts are useful.

## Source Of Truth

Visual tools are supporting artifacts. They must not become the only place where a requirement, validation rule, API field, permission rule, or state transition exists.

Use this authority order:

1. User stories and FRD for business behavior.
2. FNRD for production constraints.
3. HLD and LLD for architecture and implementation design.
4. OpenAPI for external HTTP input/output contracts.
5. Validation specs for form controls, server validation, and message keys.
6. WEB specs for route, screen, state, and transition behavior.
7. Penpot and draw.io artifacts for visual explanation.

When a visual artifact conflicts with Markdown or OpenAPI, update the authoritative document first, then update the visual artifact.

## Tool Responsibilities

| Tool                   | Use for                                                                                                                                    | Do not use for                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Penpot                 | Wireframes, medium-fidelity screens, clickable flows, design system exploration, responsive layout decisions, handoff notes.               | Final authority for business rules, API contracts, validation rules, or database design. |
| draw.io / diagrams.net | Architecture diagrams, ER-style diagrams, sequence diagrams, state machines, deployment diagrams, data flow diagrams, dependency diagrams. | Detailed visual UI design, interactive prototypes, or component styling decisions.       |
| Markdown tables/lists  | Rules, acceptance criteria, validation matrices, permissions, status tracking.                                                             | Dense spatial flows that are clearer as a diagram.                                       |
| OpenAPI                | HTTP request/response schema and examples.                                                                                                 | Screen layout or internal service implementation design.                                 |

## Why Penpot Helps This Project

Penpot is useful for the Salon Owner and Partner web work because the product has dense operational screens: appointment calendar, POS checkout, customer CRM, inventory, staff schedule, and dashboard views.

Use Penpot when the implementation needs clarity on:

- page layout and visual hierarchy;
- action placement;
- screen-to-screen flow;
- modal, drawer, and dialog behavior;
- empty, loading, forbidden, validation, conflict, and server-error states;
- responsive desktop/tablet/mobile behavior;
- reusable UI component patterns;
- design tokens and theme-level decisions.

Penpot artifacts must link back to:

- the feature `WEB/*.md` document;
- the feature `VALIDATION/*-validation.md` document;
- the related OpenAPI operation IDs;
- the related test spec when the visual flow affects verification.

## Why draw.io Helps This Project

draw.io/diagrams.net is useful because architecture diagrams and domain flows must be easy to version, review, and keep close to the repository.

Use draw.io when the implementation needs clarity on:

- domain boundaries and module dependencies;
- request, command, event, and persistence flows;
- lifecycle state machines;
- appointment/POS/inventory transaction sequences;
- multi-tenant/business/branch scoping;
- deployment and environment topology;
- data flow and trust boundaries.

draw.io artifacts must link back to:

- the relevant HLD/LLD document;
- the relevant FRD business rules;
- the relevant OpenAPI operations or service contracts;
- the relevant test strategy or feature test spec when the diagram defines a verifiable flow.

## Repository Organization

For a feature named `<feature>`, use this structure when visual artifacts exist:

```text
docs/specs/<feature>/
  WIREFRAMES/
    README.md
    <screen-or-flow>.md
    exports/
      <screen-or-flow>.svg
      <screen-or-flow>.png
  DIAGRAMS/
    README.md
    <diagram-name>.drawio.svg
```

Rules:

- `WIREFRAMES/*.md` stores Penpot file/page links, frame IDs, screen states, and traceability.
- `WIREFRAMES/exports/**` stores stable exported images only when needed for review without opening Penpot.
- `DIAGRAMS/*.drawio.svg` is preferred for draw.io diagrams because it is viewable as SVG and can contain editable diagram data.
- `.drawio` or `.drawio.xml` is allowed when SVG export is unsuitable.
- Avoid committing opaque screenshots when an editable export is available.
- Do not store temporary exports under `docs/**`; use `work/**` during drafting.

## Penpot Workflow

Create a Penpot artifact only after the corresponding feature has enough FRD/WEB/VALIDATION/API detail to avoid drawing guesswork.

For each Penpot screen group:

1. Create frames for desktop first when the workflow is operational and data-dense.
2. Add tablet/mobile frames only for screens that are part of MVP responsive delivery.
3. Name frames with stable IDs matching the WEB docs, for example `appointments.calendar.desktop`.
4. Include states for loading, empty, validation error, conflict, forbidden, and server error when those states affect layout.
5. Use design tokens for colors, spacing, typography, and component states once the design system stabilizes.
6. Add notes for interactions that are not obvious from the frame.
7. Link each frame from the matching `WIREFRAMES/*.md` file.

Penpot frame notes must not duplicate long validation tables or API schemas. Link to the authoritative Markdown/OpenAPI file instead.

## draw.io Workflow

Create a draw.io diagram when a flow or relationship is easier to understand spatially than in prose.

For each diagram:

1. Store the editable diagram under `DIAGRAMS/`.
2. Use `.drawio.svg` when practical so the file is both reviewable and editable.
3. Keep one diagram focused on one concern.
4. Include a short legend for actor, system, database, event, and external dependency shapes.
5. Link the diagram from the HLD/LLD/FRD document that it supports.
6. Update the diagram in the same change as the spec when the visualized flow changes.

Do not use diagrams as a substitute for written state transition tables, API contracts, or validation matrices.

## Suggested Salon Owner Visual Pack

Create these first because they reduce the highest implementation ambiguity:

| Area                     | Penpot artifact                                       | draw.io artifact                                       |
| ------------------------ | ----------------------------------------------------- | ------------------------------------------------------ |
| Appointment              | Calendar, create/edit, conflict resolution flow.      | Booking availability and status lifecycle sequence.    |
| POS                      | Checkout, payment, invoice, refund screens.           | Sale finalization transaction sequence.                |
| Customer CRM             | Search, profile, notes, consent, merge flow.          | Customer ownership, visit history, and merge flow.     |
| Inventory                | Product list, stock balance, adjustment, transfer.    | Stock ledger and branch stock movement flow.           |
| Staff                    | Staff profile, schedule, skills, branch assignment.   | Staff assignment and roster conflict flow.             |
| Service Catalog          | Service/category forms, pricing, branch availability. | Service snapshot use in appointment and POS flows.     |
| Dashboard                | Owner overview and branch manager dashboard.          | Reporting read model data flow.                        |
| Business/Branch Settings | Profile, policy, hours, holiday screens.              | Tenant/business/branch scoping and policy inheritance. |

## Review Checklist

Before marking a visual artifact ready:

- The artifact has an owning Markdown file.
- The owning Markdown file links back to the visual artifact.
- The visual artifact links or names the related feature, screen, route, operation ID, or rule ID.
- The visual artifact does not introduce behavior missing from FRD/LLD/API/VALIDATION/WEB docs.
- The artifact covers the important states, not only the happy path.
- Exported files are editable or backed by an editable source.
- Sensitive data and real credentials are not present.
- The diagram or wireframe remains readable in repository review.

## Official References

- Penpot describes itself as an open-source design platform and lists wireframing, prototyping, code inspect, and design tokens as core capabilities: <https://penpot.app/>.
- Penpot documents design tokens as a shared source of truth that can be used across tools and frameworks: <https://help.penpot.app/user-guide/design-systems/design-tokens/>.
- Penpot documents code inspect, CSS/SVG/HTML access, self-hosting, integrations, and interactive prototyping: <https://penpot.app/code>.
- draw.io documents online, desktop, self-hosted, GitHub, VS Code, and other integrations: <https://www.drawio.com/integrations>.
- draw.io documents export formats including `.drawio`, `.xml`, `.png`, `.svg`, `.html`, and `.pdf`, plus embedded editable diagram data in supported formats: <https://www.drawio.com/doc/faq/export-diagram>.
- draw.io GitHub integration documents editing, storing, and version-controlling `.drawio`, `.png`, `.svg`, and `.xml` diagram files directly in repositories: <https://jgraph.github.io/drawio-github/>.
