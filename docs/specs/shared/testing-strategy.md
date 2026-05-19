# Project-Wide Testing Strategy

**Date:** 2026-05-18
**Status:** Current cross-cutting baseline

## Purpose

Define test levels, coverage expectations, and verification rules for backend, frontend, contract, and e2e work.

## Test Levels

| Level | Purpose | Typical location |
| --- | --- | --- |
| Backend unit | Verify service, controller, guard, mapper, and policy behavior in isolation. | `libs/server/**/src/**/*.spec.ts` |
| Backend integration | Verify feature behavior with real database and Nest wiring where meaningful. | `libs/server/**/tests/integration/**/*.it-spec.ts` |
| Web unit/component | Verify Angular components, services, stores, validators, and guards. | `libs/web/**/src/**/*.spec.ts` |
| Contract | Verify OpenAPI and implementation route parity. | Scripts or project-specific contract tests. |
| E2E smoke | Verify thin full-stack journeys and deployment wiring. | `apps/e2e/**` |
| Accessibility | Verify keyboard, focus, semantic roles, and announcements. | Web tests and e2e. |
| Performance/NFR | Verify latency, load, rendering, and provider failure assumptions. | Feature-specific tooling. |

## Coverage Expectations

- Backend feature libraries must maintain 100% statements, lines, and functions, and at least the documented branch threshold unless an approved exception exists.
- High-risk backend feature work should keep UT and IT coverage separate and visible.
- Frontend coverage must be meaningful for services, validators, guards, stores, and non-trivial components.
- Coverage must not be achieved by ignoring paths with Istanbul markers unless explicitly approved and documented.

## Required Test Mapping

Each feature test spec must map tests to:

- FRD rule IDs;
- permission rules;
- validation rules;
- API operation IDs;
- state transitions;
- conflict cases;
- audit requirements where relevant.

## Backend Integration Test Rules

- Use deterministic seed data.
- Use unique test records per test case when parallel execution is possible.
- Clean up test data in `afterEach` or `afterAll` according to fixture type.
- Do not rely on execution order.
- Avoid real external providers; use adapters/mocks unless an e2e environment is explicitly configured.

## Web Test Rules

- Keep component tests deterministic.
- Use HTTP testing utilities for API services.
- Verify loading, empty, forbidden, validation, conflict, and server-error states for operational screens.
- Verify SSR safety for browser-only APIs.
- Verify accessibility for dialogs, forms, focus, and live regions.

## Contract Test Rules

- OpenAPI must be linted before merge for implementation-scope APIs.
- Route parity checks are required for APIs where controller reflection or equivalent scripts exist.
- DTO examples must stay aligned with schemas and frontend service contracts.

## E2E Test Rules

Full e2e coverage is not required before every feature exists. A minimal foundation must still exist so future full-stack flows can be added without reworking structure. See [E2E Foundation](e2e-foundation.md).

## CI Expectations

Every implementation PR should run the narrowest reliable affected checks first. Before merge, feature work must have:

- lint pass;
- type-check pass where available;
- unit tests pass;
- integration tests pass where feature has integration behavior;
- OpenAPI lint and parity checks for API changes;
- e2e smoke checks when the changed path is covered by existing e2e.
