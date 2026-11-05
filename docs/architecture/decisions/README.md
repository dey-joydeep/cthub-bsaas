# Architecture Decision Records

**Status:** Active register

This directory records consequential technical and architectural decisions when they are made. An ADR preserves the reason for a choice; the current HLD, LLD, OpenAPI contract, schema, and code remain the sources for current behavior. Link the ADR from affected design documents and update those documents in the same change that accepts or supersedes a decision.

For choices already in the repository, use `Recorded baseline` when the implementation or current design is verifiable but the original decision date, alternatives, or approval evidence cannot be recovered. Cite the evidence and distinguish observed facts from inferred rationale. This status documents the existing architecture; it is not a fresh endorsement or a substitute for required review of a new decision. Do not backdate a retrospective ADR or claim an original reviewer without evidence.

## When to write one

Create an ADR before or alongside implementation when a choice has a material effect on system boundaries, technology or persistence strategy, tenant or security controls, deployment and operations, or a migration that would be costly to reverse. Start with `proposed` while alternatives or evidence are still being evaluated. Do not create an ADR for a routine dependency patch, local refactor, or detail already governed by an accepted design.

The solution architect owns cross-system decisions. The database architect owns data architecture decisions with the solution architect. The coordinator ensures a decision is identified before build, links it to its issue and PR, and routes critical architecture choices to an independent Codex reviewer. Security, identity, tenant-isolation, and financial choices also follow the separate security review thresholds in the [AIDD life cycle](../../aidd/development-lifecycle.md).

## Record lifecycle

1. Copy [the template](template.md) into the next numbered `NNNN-short-title.md` file and add it to the index below. Use a stable number; never reuse one.
2. Record the context, alternatives, evidence, status, consequences, owner, date, and related issue/PR. State unknowns explicitly. A proposal must not be described as approved architecture; a recorded baseline must not invent its original rationale.
3. Before moving to `accepted`, reconcile affected HLD/LLD/API/data/operations documents and obtain the required independent review. Record the decision maker and review evidence. The owner decides product or budget changes; the architect resolves technical design within accepted product intent.
4. Keep accepted records immutable in meaning. If a decision changes, add a new ADR, mark the old one `superseded` with a link, and update the affected specs. Use `rejected` for a proposal that was evaluated and declined; record why.

An ADR does not authorize a task, migration, merge, or deployment. The linked issue and AIDD gates control delivery.

## Index

| ID                                              | Topic                                         | Status            | Owner                            |
| ----------------------------------------------- | --------------------------------------------- | ----------------- | -------------------------------- |
| [0001](0001-backend-framework-selection.md)     | Backend framework: NestJS or Java/Spring Boot | Proposed          | Solution architect               |
| [0002](0002-current-application-composition.md) | Nx workspace and application boundaries       | Recorded baseline | Solution architect               |
| [0003](0003-prisma-persistence-strategy.md)     | Prisma as the primary persistence tool        | Recorded baseline | Database architect               |
| [0004](0004-tenant-business-branch-scope.md)    | Tenant, business, and branch scope            | Recorded baseline | Solution and database architects |
