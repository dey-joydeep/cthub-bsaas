# Infrastructure Upgrade Plan - 2026-05-01

## Purpose

This directory is the planning anchor for modernizing the CTHub BSaaS workspace infrastructure. It is intentionally documentation-only. No implementation is included here.

## Objectives

1. Modernize the infrastructure to current stable releases.
2. Keep architectural boundaries and linting strict.
3. Prioritize TypeScript plus ESM-friendly testing.
4. Tighten security-related runtime and dependency posture.
5. Align the repository with standard Nx monorepo structure where it has drifted.

## Target Baseline

Nx does not publish a separate "LTS" channel comparable to Node.js. For this plan, "Nx latest LTS or equivalent" means:

- Use the latest stable Nx release available at execution time.
- For the 2026-05-01 planning snapshot, that is Nx `22.7.1`.
- If Nx `23` or a later major is current when the work starts, run the official migration generator first and re-evaluate Angular, TypeScript, and Vitest compatibility before accepting the newer major.

Angular migration remains governed by the official Angular Update Guide even though this workspace should execute the package/project migration through Nx. For the Angular 20 to 21 step, record the Angular guide output for advanced complexity with Angular Material and Windows selected before accepting the migration.

## Documents

- [Current State And Gaps](./current-state-and-gaps.md)
- [Target Version Matrix](./target-version-matrix.md)
- [Migration Execution Plan](./migration-execution-plan.md)
- [Configuration And Boundary Checklist](./configuration-and-boundary-checklist.md)
- [Deadline Fallback Strategy](./deadline-fallback-strategy.md)

## Non-Goals For First Iteration

- Rewrite the backend from NestJS/Node.js to Java/Spring.
- Convert backend Jest tests to Vitest in the first pass.
- Replace Prisma or the database architecture.
- Rework domain modules beyond what is necessary for Nx, lint, test, build, and security alignment.

## Source References

- Angular version compatibility: https://angular.dev/reference/versions
- Angular 20 to 21 update guide: https://angular.dev/update-guide?v=20.0-21.0&l=3
- Angular testing overview: https://angular.dev/guide/testing
- Nx inferred tasks: https://nx.dev/docs/concepts/inferred-tasks
- Nx module boundaries: https://nx.dev/technologies/eslint/eslint-plugin/recipes/enforce-module-boundaries
- Nx Vitest plugin: https://nx.dev/docs/technologies/test-tools/vitest/introduction
- Nx Vitest migrations: https://nx.dev/docs/technologies/test-tools/vitest/migrations
- Node.js releases: https://nodejs.org/en/about/previous-releases

---

## Next Upgrade Cycle Guidance

For architectural decisions, deferred migrations (Angular 22), and housekeeping items (Nx v24 deprecations, NestJS v12 Vitest roadmap, Prisma ORM strategy) for future cycles, reference:

- [Next Upgrade Cycle Memo](../next-cycle-memo.md)
