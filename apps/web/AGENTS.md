# Angular App Shell Guidelines

Read `libs/web/AGENTS.md` first, then this file, before working under `apps/web/**`.

## Ownership

- `apps/web/admin`, `apps/web/partner`, and `apps/web/customer` are runnable Angular and SSR application shells. Keep bootstrapping, routing composition, server entry points, app configuration, assets, and deployment packaging here.
- Put reusable UI and feature behavior in the appropriate `libs/web/**` library. Keep shared client contracts in `libs/shared/**` only when they are framework independent.
- Do not change another persona's shell or shared libraries merely because an app shell change is nearby. Name cross-area files in the task assignment and read their scoped instructions.
- Changes to authentication, authorization, environment configuration, or SSR boundaries require the relevant contract and independent review from `docs/aidd/development-lifecycle.md`.
- Dev-only interceptors and test providers must be conditionally registered in `withInterceptors` or `providers` using `!environment.production ? [devInterceptor] : []`. They must never be registered unconditionally in production pipelines.

## Verification

- Read the affected app's `project.json` before choosing an Nx target. Run its lint target and the narrowest meaningful build or browser check for the change; run library tests when behavior is implemented there.
- For visible or SSR changes, inspect the affected route in a browser and verify console, hydration, responsive layout, keyboard access, and changed loading/error states. Report unavailable prerequisites.
- Keep app-specific Docker or server configuration changes aligned with the DevOps and release evidence for that slice.
