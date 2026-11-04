# ADR-0002: Current Application Composition and Boundaries

- **Status:** Recorded baseline
- **Date recorded:** 2026-11-04
- **Original decision date:** 2025; exact date unknown
- **Owner:** Solution architect
- **Decision maker:** Project owner for the initial Node.js and Angular choices; later framework and workspace decision makers not fully recorded
- **Related issue/PR:** [Issue #109](https://github.com/dey-joydeep/cthub-bsaas/issues/109); [Nx and Angular upgrade PR #91](https://github.com/dey-joydeep/cthub-bsaas/pull/91)
- **Supersedes / superseded by:** None

## Context and evidence

The [workspace manifest](../../../package.json) defines one Nx/npm workspace with API, three Angular web apps, server libraries, shared libraries, and web libraries. The [Salon Owner HLD](../../specs/salon-owner/HLD/overview.md) describes a NestJS API shell under `apps/api`, backend features and ports under `libs/server`, and Angular feature and UI libraries under `libs/web`. The [domain architecture HLD](../../specs/salon-owner/HLD/domain-architecture.md) defines bounded contexts and dependency direction. The [upgrade memo](../../infra-upgrade/next-cycle-memo.md) records the completed Nx 24 and Angular 22 upgrade.

The project owner reports that the repository began in 2025 as an experiment in AI agentic coding. Node.js was chosen for the backend to learn and build quickly; Angular was chosen for expected long-term frontend support. The original evaluation and approval record for choosing NestJS, Nx, or the present module boundaries was not found. The existence of code and HLDs is evidence of the baseline, not proof that every planned context is implemented.

## Recorded choice

Use one Nx workspace for the Angular applications and NestJS API. Keep runtime entry points under `apps/**`, reusable implementation under `libs/**`, and the backend's feature, contract, and infrastructure boundaries explicit. The repository defines one API application; the HLD's bounded contexts do not imply separately deployed services.

## Rationale and alternatives

The owner-supplied reasons for the initial language and frontend choices are learning speed and rapid construction for Node.js, and expected long-term support for Angular. The HLD specifies dependency boundaries and shared contracts. It is reasonable to infer that these support coordinated changes across web and API, but the original rationale for Nx and these boundaries is unknown. Separate repositories and separately deployed services are possible alternatives; this record does not claim they were evaluated at the original decision. The owner considered Java/Spring Boot for the backend several times and reports that migration was discouraged; the reasons and participants in those discussions are not yet documented. [ADR-0001](0001-backend-framework-selection.md) reopens that question for evidence-based evaluation.

## Consequences

- Cross-project dependencies and tests can be checked in one workspace; changes to shared contracts can affect multiple apps.
- A backend framework change would need a deliberate build and contract integration plan. [ADR-0001](0001-backend-framework-selection.md) is an open evaluation, so the NestJS baseline remains current.
- Feature HLDs and code, not this record, define the exact implementation state of each bounded context.

## Review and history

- 2026-11-04: Existing composition recorded retrospectively from code and design documents. The owner supplied the 2025 project origin and the Node.js and Angular selection reasons. The original rationale for Nx and detailed boundaries remains unknown. Independent review of this record is pending.
