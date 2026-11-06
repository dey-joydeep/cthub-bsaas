# ADR-0001: Backend Framework Selection

- **Status:** Proposed
- **Date recorded:** 2026-11-03
- **Original decision date:** Not applicable; evaluation is open
- **Owner:** Solution architect
- **Decision maker:** Pending owner input and technical assessment
- **Related issue/PR:** [Issue #109](https://github.com/dey-joydeep/cthub-bsaas/issues/109)
- **Supersedes / superseded by:** None

## Context

The backend currently uses NestJS 11, TypeScript, Prisma 6, and Nx 24. [ADR-0002](0002-current-application-composition.md) and [ADR-0003](0003-prisma-persistence-strategy.md) document the existing composition and persistence baseline. Authentication has established behavior and tests, while further salon domains are being delivered. The [Salon Owner HLD](../../specs/salon-owner/HLD/overview.md) assumes this structure. An earlier [infrastructure plan](../../infra-upgrade/20260501/README.md) excluded a Java/Spring rewrite from that upgrade's scope; it did not evaluate the long-term framework choice.

The owner reports considering Java with Spring Boot several times since the project began as an AI coding experiment in 2025. Earlier migration proposals were discouraged, but the reasons and participants were not recorded. The original Node.js choice favored learning and rapid construction; this evaluation must now test whether that reason still fits a long-term salon SaaS. A rewrite would affect language, build tooling, persistence integration, deployment, tests, agent guidance, and cross-language contracts. The choice should be made before many more salon domains accumulate, but the historical discouragement and a new preference alone are insufficient to settle it.

## Decision drivers

- Correct tenant, business, and branch authorization across a complete request path.
- Ability to preserve the current OpenAPI behavior, error contracts, and database migration safety.
- Maintainability for one human owner with AI agents doing most implementation and review.
- The owner's long-term maintenance preference and whether learning speed remains a relevant driver.
- Measured implementation and verification effort for a representative vertical slice.
- Operational fit: deployment footprint, health/metrics, startup, debugging, and rollback.
- Total migration cost and disruption to planned salon feature delivery.

## Options

| Option                                      | Benefits                                                                                   | Costs and risks                                                                                                                    | Evidence needed                                                                                           |
| ------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Retain NestJS/TypeScript/Prisma             | Reuses existing auth implementation, tests, Nx tasks, and one language across web and API. | Existing backend toolchain and operational gaps still need attention.                                                              | Baseline build/test results, representative slice implementation time, production-like operations probe.  |
| Migrate backend to Java/Spring Boot         | Offers a mature Java ecosystem and Spring Boot operational facilities.                     | Requires replacing backend code, Prisma integration, build/test pipelines, and agent instructions; creates a temporary dual stack. | Equivalent Spring slice, contract and tenant-boundary tests, deployment measurements, migration estimate. |
| Adopt Spring only for a new bounded service | Limits initial rewrite scope and can test JVM fit in real integration.                     | Adds a second runtime, cross-service contracts, deployment, and observability overhead.                                            | Demonstrated independent service boundary and net benefit over a single backend.                          |

## Decision

**Pending.** This ADR does not select Spring Boot, approve a rewrite, or change the current NestJS implementation baseline. Continue the existing backend contract until a separate acceptance decision is recorded.

## Evaluation and follow-up

1. Baseline the existing NestJS path and define one representative slice with authentication, tenant/branch denial, a database transaction, errors, OpenAPI parity, integration tests, and health/metrics.
2. Implement the same bounded behavior in an isolated Spring Boot spike. Do not route production traffic to it or change the live database schema as part of the evaluation.
3. Compare testability, agent implementation/review effort, runtime measurements under the same workload, deployment and rollback work, and the estimated cost to migrate existing auth and future domains.
4. Have an independent Codex architecture reviewer challenge the comparison. Obtain separate Codex security assessments where identity or tenant isolation is affected.
5. Present the evidence and recommendation to the owner. If a choice is accepted, update this ADR and reconcile affected HLD/LLD, CI, operations, and implementation plans in the decision PR before migration work begins.

The spike is follow-up work requiring its own bounded scope and tracking. This proposed ADR alone authorizes no backend implementation or migration.

## Review and history

- 2026-11-03: Proposal opened. No framework choice or independent decision review recorded yet.
- 2026-11-04: Added the owner's account of the 2025 project origin, initial Node.js rationale, and repeated Spring Boot discussions. The reasons those migrations were discouraged remain unknown.
