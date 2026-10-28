# API App Guidelines

Read this file before working under `apps/api/**`.

## Purpose

`apps/api` is the NestJS application shell. It should wire modules, global middleware, filters, guards, interceptors, CORS, Swagger, and runtime configuration. Domain behavior belongs in server feature libraries.

## Rules

- Keep business logic out of `apps/api`.
- Wire cross-cutting server behavior here when it is app-global.
- Use providers from `@cthub-bsaas/server-core` and feature/infrastructure modules.
- CORS must allow and expose headers required by browser clients, including CSRF and correlation headers.
- Cookie parser, body limits, security middleware, validation, guards, filters, and versioning should remain centralized.
- Do not bind test stubs in production app modules.

## Auth-Related App Wiring

- `CorrelationIdMiddleware` must be registered before request handling that needs correlation context.
- `GlobalExceptionFilter` must be registered globally for canonical error envelopes.
- Throttling wiring must preserve `Retry-After`.
- Global guards must preserve `@Public()` and `@SkipCsrf()` semantics.

## Validation

- For Auth-affecting app wiring, run Auth UT/IT where practical.
- Run OpenAPI route parity after changing Auth controllers or route registration.
- Use a local running API for HTTP smoke checks when it adds evidence beyond automated tests. Start only the services needed and report unavailable prerequisites.
