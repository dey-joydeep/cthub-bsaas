# ADR-0003: Prisma as the Primary Persistence Tool

- **Status:** Recorded baseline
- **Date recorded:** 2026-11-04
- **Original decision date:** Unknown
- **Owner:** Database architect
- **Decision maker:** Original decision maker not recorded
- **Related issue/PR:** [Issue #109](https://github.com/dey-joydeep/cthub-bsaas/issues/109); [Nx and Angular upgrade PR #91](https://github.com/dey-joydeep/cthub-bsaas/pull/91)
- **Supersedes / superseded by:** None

## Context and evidence

The backend uses the [Prisma schema](../../../libs/server/data-access/prisma/schema.prisma) for PostgreSQL. The [infrastructure cycle memo](../../infra-upgrade/next-cycle-memo.md) explicitly retained Prisma 6 as the sole ORM standard and placed complex SQL inside infrastructure adapters behind repository interfaces. The [Salon Owner HLD](../../specs/salon-owner/HLD/overview.md) also describes Prisma repositories and transactions.

## Recorded choice

Use Prisma as the primary ORM for the current TypeScript backend. Keep persistence access behind server contracts and infrastructure adapters. For complex reporting or database-specific queries, the existing memo permits Prisma's typed or parameterized raw SQL facilities rather than a second ORM.

## Rationale and alternatives

The memo states that Prisma returns plain TypeScript objects without an identity map or lazy-loading behavior. It names a second ORM as an approach to avoid. Other originally considered persistence tools and the original decision date are unknown; this record does not reconstruct them.

## Consequences

- The Prisma schema and migrations remain the implementation source for database shape; this ADR records the strategy and rationale.
- A Java/Spring Boot migration would require a new persistence decision. Java cannot reuse the TypeScript Prisma client as its native repository layer.
- Tenant and branch query isolation must be validated in application behavior; choosing Prisma does not establish that property by itself.

## Review and history

- 2026-11-04: Existing strategy recorded from the implementation and infrastructure memo. Original approval evidence is unknown. Independent review of this record is pending.
