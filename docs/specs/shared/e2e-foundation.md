# E2E Foundation

**Date:** 2026-05-18
**Status:** Current cross-cutting baseline

## Purpose

Define the minimal e2e structure expected before full FE+BE journeys are implemented. The goal is to avoid pretending full e2e coverage exists while still keeping the workspace ready for it.

## Principles

- E2E projects should remain app-level, not library-level.
- E2E should validate deployed behavior and high-value user journeys, not duplicate all unit or integration tests.
- Early e2e foundation may contain health, shell, auth smoke, and placeholder structure.
- Feature e2e scenarios must be added only when the backend, frontend, data setup, and test environment are stable enough.

## Expected Project Areas

| Area | Purpose |
| --- | --- |
| `apps/e2e/api` | API smoke and high-value backend contract flows. |
| `apps/e2e/web/admin` | Admin app smoke and future platform admin journeys. |
| `apps/e2e/web/partner` | Partner/salon owner app smoke and future salon operations journeys. |
| `apps/e2e/web/customer` | Customer app smoke and future public-to-customer journeys. |

## Minimal Foundation

Each e2e project should eventually provide:

- runnable project target;
- deterministic environment config;
- test data setup strategy;
- base URL configuration;
- smoke test that verifies the app or API is reachable;
- no fake pass that hides broken setup;
- clear skip or TODO notes only when a dependent feature is not implemented.

## Future Scenario Candidates

| App | Smoke candidates |
| --- | --- |
| API | health, auth login, authenticated profile, OpenAPI availability when exposed. |
| Admin | login, tenant/business lookup, support audit view. |
| Partner | login, branch selector, appointment create, POS checkout, dashboard summary. |
| Customer | public search, salon profile, booking start, customer login/profile. |

## Data Setup Rules

- Use isolated test accounts and branches.
- Avoid modifying shared developer data.
- Prefer API or database fixture helpers over brittle UI setup.
- Clean up records unless the environment is disposable.

## Documentation Rule

Feature docs must identify e2e candidates even when the actual e2e test is deferred. Deferred e2e must state the dependency blocking implementation.
