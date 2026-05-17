# Server Codex Instructions

These instructions apply when Codex works under `libs/server`.

## Server structure

- `core`: cross-cutting backend concerns such as auth guards, decorators, filters, config, i18n, validation, errors, shared services, and common types.
- `data-access`: Prisma and database access concerns.
- `contracts-*`: DI tokens, ports, request/response contracts, and boundaries where used.
- `features/*`: domain features with controllers, DTOs, models, repositories, services, validators, and tests.

## Backend rules

- Keep controllers thin.
- Keep business logic in services/use cases.
- Keep persistence logic in repositories/data-access according to the existing local pattern.
- Reuse core guards, decorators, filters, validation, i18n, error, and config patterns.
- Do not duplicate guards or cross-cutting infrastructure inside a feature library.
- Prefer dependency-inversion through existing tokens/ports where the project already uses them.
- Do not import frontend/web libraries into server code.
- Avoid deep cross-library relative imports; use configured package aliases and package roots.

## DTO, validation, and error rules

- Use explicit DTO classes for NestJS request/response boundaries where validation/serialization is needed.
- Do not expose Prisma/persistence entities directly through API responses.
- Keep API responses aligned with the existing response-envelope/error-contract pattern.
- Add or update validation decorators when accepting new request fields.
- Add or update i18n/error-code mappings when introducing new user-facing errors.
- Supported locales are `en`, `bn`, and `hi`.

## Data and Prisma rules

- Do not add or rename Prisma fields without documenting schema, migration, API, and test impact.
- Prefer small focused migrations.
- Respect existing FK/cascade behavior.
- Use transactions where multiple writes must succeed or fail together.
- Avoid N+1 query patterns.

## Testing expectations

- Add or update unit tests for changed service/controller behavior.
- Add or update integration tests for API/database behavior when relevant.
- Keep tests deterministic and isolated.
- Prefer typed mocks over `any`.
- Do not weaken coverage thresholds.

## Targeted validation examples

```powershell
npx nx test server-core
npx nx test server-data-access
npx nx test server-feature-auth --configuration=ut
npx nx test server-feature-auth --configuration=it
npx nx lint api
npx nx build api
```

Use the exact project name from `npx nx show projects` or the relevant `project.json`.
