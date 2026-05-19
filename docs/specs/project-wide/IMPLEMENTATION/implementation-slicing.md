# Project-Wide Implementation Slicing

**Date:** 2026-05-19
**Status:** Production planning baseline

## Purpose

Define the implementation order, project boundaries, validation gates, and branch strategy for converting the documentation baseline into code. This document is the handoff from product/architecture documentation to development execution.

## Inputs

| Source | Use |
| --- | --- |
| `docs/specs/shared/**` | Cross-cutting security, scoping, API, audit, observability, testing, and rollout rules. |
| `docs/specs/auth/API/openapi.yaml` | Implemented Auth contract and parity baseline. |
| `docs/specs/salon-owner/**` | Primary MVP business implementation baseline. |
| `docs/specs/project-wide/API/openapi.yaml` | Target OpenAPI contract for project-wide supporting areas. |
| `docs/us/**` | Product intent and acceptance context. |

## Branch Strategy

| Stream | Branch Pattern | Merge Rule |
| --- | --- | --- |
| Documentation correction | `docs/<scope>` | Merge before implementation if it changes a binding contract. |
| Backend feature implementation | `feature/server-<feature>` | Must pass build, lint, UT, IT, and OpenAPI parity gates for the touched feature. |
| Frontend feature implementation | `feature/web-<feature>` | Must pass build, lint, type-check, unit tests, SSR safety review, and API contract alignment. |
| Cross-cutting infrastructure | `chore/platform-<scope>` | Must be merged before dependent feature branches. |

No implementation branch may change a business rule silently. If code reveals a requirement gap, update the relevant FRD/HLD/LLD/API/Validation/Test document first.

## Slice Order

| Order | Slice | Primary Scope | Blocking Reason |
| --- | --- | --- | --- |
| 1 | Shared platform contracts | response envelope, correlation ID, tenant/business/branch guards, error codes, audit interface, test helpers | Required by every feature. |
| 2 | Auth hardening continuation | session security, profile handoff, guard reuse, OpenAPI parity scripts | Already implemented foundation; must remain stable for all protected APIs. |
| 3 | Salon Owner business settings and branch settings | business, branch, hours, holiday, policy APIs and screens | Establishes tenant/business/branch data required by operational features. |
| 4 | Staff and service catalog | staff, roles, skills, services, categories, eligibility | Required before appointment availability and POS service selection. |
| 5 | Customer CRM | customer profile, notes, communication preferences, visit history | Required by appointment booking, POS, reviews, and privacy workflows. |
| 6 | Appointment scheduling | day board, slots, appointment lifecycle, walk-ins | Central operational workflow; depends on branch, staff, service, and customer data. |
| 7 | POS and inventory | invoice, payment capture, pending dues, stock movement, low-stock alerts | Depends on completed appointments, customers, services, branch context. |
| 8 | Dashboard and reporting read models | owner dashboard, alerts, operational reports, exports | Depends on events/read models from appointment, POS, inventory, customer, and staff. |
| 9 | Public discovery and customer app | public salon profile/search, booking, customer appointments, rewards, receipts | Uses stable salon owner operational data and customer identity. |
| 10 | Notifications, integrations, reputation, privacy | delivery templates/logs, provider configuration, review workflows, export/delete governance | Depends on stable core domain events and audit/privacy rules. |
| 11 | Platform admin | provisioning, tenant status, support view, feature flags, maintenance, platform reporting | Requires mature tenant lifecycle and audit controls. |

## Backend Project Plan

| Feature Area | Expected Nx Projects | Notes |
| --- | --- | --- |
| Shared contracts | `shared`, `server-core`, `server-contracts-*` | Keep pure types in shared only when browser-safe. Keep ports in contracts libs. |
| Salon Owner core | `server-feature-salon-owner`, feature-specific contracts, infrastructure adapters | Split further only when project size or ownership demands it. Do not prematurely fragment every screen into a library. |
| Customer app/public discovery | `server-feature-customer-app`, `server-feature-public-discovery` | Public endpoints must not import protected partner-only modules directly. |
| Notifications/integrations | `server-feature-notifications`, `server-feature-integrations` | Provider implementations live in infrastructure; features depend on ports. |
| Reporting/reputation/privacy | `server-feature-reporting`, `server-feature-reputation`, `server-feature-data-privacy` | Read models and exports must enforce scope and audit rules. |
| Platform admin | `server-feature-platform-admin` | Admin-only module; all actions require platform permissions and audit events. |

## Frontend Project Plan

| App/Area | Expected Nx Projects | Notes |
| --- | --- | --- |
| Shared web foundation | `web-core-*`, `web-ui`, `web-config` | SSR-safe services, auth state, HTTP envelope handling, reusable UI. |
| Partner app | `web-partner-*` feature libs | Implement Salon Owner operational workflows first. |
| Customer app | `web-customer-*` feature libs | Implement after public discovery and customer APIs stabilize. |
| Admin app | `web-admin-*` feature libs | Implement platform admin after tenant lifecycle contracts stabilize. |

## Required Validation Gates

| Gate | Command/Check | Required For |
| --- | --- | --- |
| Format | `git diff --check` | Every PR. |
| OpenAPI lint | `node_modules/.bin/redocly.cmd lint <openapi.yaml> --config .redocly.yaml --max-problems=0` | Every OpenAPI change. |
| API parity | Feature-specific route parity script or test | Every backend API implementation PR. |
| Backend unit tests | `npx nx test <server-feature> --configuration=ut` | Every backend feature PR. |
| Backend integration tests | `npx nx test <server-feature> --configuration=it` | Every backend feature PR that touches DB/API behavior. |
| Backend build/lint | `npx nx build <server-feature>` and `npx nx lint <server-feature>` | Every backend feature PR. |
| Web type-check/lint/test | `npx nx run <web-project>:type-check`, `npx nx lint <web-project>`, `npx nx test <web-project>` | Every frontend feature PR. |
| E2E smoke | App-level e2e smoke when feature route is user-reachable | Required once the feature has a runnable vertical slice. |

## Definition Of Ready For A Feature Slice

A slice is ready for coding only when all items are true:

| Check | Rule |
| --- | --- |
| User story trace | The slice links to one or more user-story IDs or an explicit cross-cutting standard. |
| FRD/HLD/LLD | Business rules, boundaries, commands/queries, transactions, and errors are documented. |
| API contract | OpenAPI operation IDs, paths, params, bodies, responses, and errors are present. |
| Validation | Backend authoritative validation and frontend mirror behavior are documented. |
| Web behavior | Routes, page state, permission behavior, loading/empty/error states, and SSR notes are documented. |
| Tests | Unit, integration, contract, web, and e2e smoke expectations are clear. |

## Definition Of Done For A Feature Slice

| Check | Rule |
| --- | --- |
| Code | Implements the documented contract without production stubs. |
| Tests | Required test tiers pass with configured coverage thresholds. |
| Lint/build | Zero lint warnings/errors and successful builds for touched projects. |
| Contract | OpenAPI lint and implementation parity pass. |
| Docs | Any changed behavior is reflected in the authoritative docs before merge. |
| Security | Permissions, CSRF, rate limits, audit, and correlation ID behavior match shared standards. |

