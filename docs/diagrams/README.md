# Project Diagrams

This directory stores repository-owned visual artifacts that support product, architecture, and implementation documentation.

Visual artifacts support the Markdown and OpenAPI documents. They do not replace the source of truth defined in:

- [Production Documentation Standard](../quality-standards/production-documentation-standard.md)
- [Visual Collaboration Guideline](../quality-standards/visual-collaboration-guideline.md)

## Structure

```text
docs/diagrams/
  auth/
    README.md
    sequences/
      *.puml
  salon-owner/
    README.md
    drawio/
    exports/
    mcp-input/
  drawio/
  exports/
  mcp-input/
```

## Folder Responsibilities

| Folder         | Responsibility                                                          |
| -------------- | ----------------------------------------------------------------------- |
| `auth/`        | Existing Auth PlantUML diagrams.                                        |
| `salon-owner/` | Salon Owner diagrams and wireframe support files.                       |
| `drawio/`      | Legacy/global draw.io staging folder; use feature folders for new work. |
| `exports/`     | Legacy/global export folder; use feature folders for new work.          |
| `mcp-input/`   | Legacy/global MCP input folder; use feature folders for new work.       |

## Tool Usage

- Use Penpot for wireframes, screen flows, interaction states, and clickable prototypes.
- Use draw.io/diagrams.net for architecture, sequence, state, dependency, data-flow, and transaction diagrams.
- Use PlantUML only for existing text-first sequence diagrams or when text diffability is more important than visual editing.

## Naming Rules

- Use kebab-case for new files.
- Prefer `.drawio.svg` for draw.io diagrams when possible.
- Keep one visual artifact focused on one flow or decision.
- Link every visual artifact from the relevant spec document.
