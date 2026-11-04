# ADR-0004: Tenant, Business, and Branch Scope

- **Status:** Recorded baseline
- **Date recorded:** 2026-11-04
- **Original decision date:** Unknown
- **Owner:** Solution and database architects
- **Decision maker:** Original decision maker not recorded
- **Related issue/PR:** [Issue #109](https://github.com/dey-joydeep/cthub-bsaas/issues/109)
- **Supersedes / superseded by:** None

## Context and evidence

The [business operating model](../../specs/salon-owner/FRD/business-operating-model.md) defines Tenant → SalonBusiness → Branch, with business-scoped customer and service data and branch-scoped operations. The [data model HLD](../../specs/salon-owner/HLD/data-model.md) requires server-side scope filters. The [Prisma schema](../../../libs/server/data-access/prisma/schema.prisma) contains `SalonTenant`, `SalonBusiness`, and `SalonBranch` models. The data model HLD also documents a transitional legacy `Salon` aggregate.

## Recorded choice

Design the platform around separate tenant, salon business, and branch boundaries. The MVP may expose one selected business and branch while preserving those boundaries for later multi-business and multi-branch use. Authorization and persistence must enforce the relevant scope on each operation.

## Rationale and alternatives

The FRD explains the business need: an owner may operate multiple businesses and branches, with staff, customers, catalog, bookings, stock, and reporting at different scopes. The original technical alternatives and approval date are unknown. A single `Salon` boundary would be simpler initially, but it would not express the full business hierarchy described in the FRD; this is a present comparison, not a claim about the original deliberation.

## Consequences and verification limit

- Business and branch identifiers must flow through requests, authorization, queries, and tests where relevant.
- The current schema contains the hierarchy, while legacy operational flows still use `Salon`. This record does not claim that every endpoint already enforces all three scopes.
- Changes to this boundary require independent Codex architecture review and the two separate Codex security assessments required for critical tenant-isolation decisions by the [AIDD life cycle](../../aidd/development-lifecycle.md).

## Review and history

- 2026-11-04: Current product and data-design baseline recorded retrospectively. Original decision review and complete runtime conformance are not established by this record. Independent review of this record is pending.
