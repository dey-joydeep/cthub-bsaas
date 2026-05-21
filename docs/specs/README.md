# Technical Specs Index

**Updated:** 2026-05-20

This folder contains current implementation and planning baselines. Removed legacy folders are documented below so implementation starts from the active baselines only.

## Current Baselines

| Area                                           | Status                                   | Notes                                                                                                                                                          |
| ---------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [auth](auth/README.md)                         | Current implementation baseline          | Auth backend is implemented against the OpenAPI route contract. Keep OpenAPI, API HLD/LLD, frontend service contracts, and server-alignment docs synchronized. |
| [salon-owner](salon-owner/README.md)           | Current implementation-planning baseline | Use this for Salon Owner MVP implementation planning across FRD, FNRD, HLD, LLD, API, Web, Validation, Test, wireframes, and diagrams.                         |
| [shared](shared/hld-baselines.md)              | Current supporting baseline              | Shared HLD/LLD patterns may be used when consistent with active feature specs.                                                                                 |
| [project-wide](project-wide/README.md)         | Current implementation-planning baseline | Supporting OpenAPI contract and implementation slicing plan for project-wide areas not covered by Auth or Salon Owner MVP OpenAPI.                             |
| [app-shell](app-shell/README.md)               | Current planning baseline                | Shared shell, navigation, context selector, global feedback, validation, tests, and wireframe notes.                                                           |
| [account-profile](account-profile/README.md)   | Current planning baseline                | Account/profile, security settings integration, preferences, privacy entry points, validation, tests, and wireframe notes.                                     |
| [customer-app](customer-app/README.md)         | Current planning baseline                | Customer dashboard, booking, appointments, rewards, receipts, reviews, validation, tests, and wireframe notes.                                                 |
| [public-discovery](public-discovery/README.md) | Current planning baseline                | Public search, salon profile, service browsing, SEO/SSR, validation, tests, and wireframe notes.                                                               |
| [platform-admin](platform-admin/README.md)     | Current planning baseline                | SaaS administration, tenant oversight, support access, feature flags, audit, validation, tests, and wireframe notes.                                           |
| [notifications](notifications/README.md)       | Current planning baseline                | Transactional, reminder, marketing, template, delivery-log, consent, validation, test, and wireframe planning.                                                 |
| [integrations](integrations/README.md)         | Current planning baseline                | Provider ports, credentials, webhooks, retries, provider health, validation, test, and wireframe planning.                                                     |
| [reporting](reporting/README.md)               | Current planning baseline                | Financial, appointment, staff, customer, inventory, platform, export, validation, test, and wireframe planning.                                                |
| [reputation](reputation/README.md)             | Current planning baseline                | Review submission, moderation, owner response, public visibility, insights, validation, test, and wireframe planning.                                          |
| [data-privacy](data-privacy/README.md)         | Current planning baseline                | Privacy requests, retention, exports, anonymization, restricted notes, merge governance, validation, and tests.                                                |

## Removed Legacy Specs

These folders predated the Salon Owner MVP and project-wide documentation baselines. They were reconciled and removed so implementation cannot accidentally use placeholder or stale API notes.

Detailed classification is maintained in [Legacy Spec Reconciliation Matrix](legacy-reconciliation.md).

| Area                                                                                             | Status                            | Cleanup rule                                                                                               |
| ------------------------------------------------------------------------------------------------ | --------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `appointment`, `dashboard`, `salon`, `user`, `settings`, `home`, `review`, `salon-staff-request` | Removed after reconciliation      | Use the current baseline folders listed above.                                                             |
| `portfolio`, `social`, `theme`                                                                   | Removed as legacy technical specs | Product intent remains under `docs/us/**`; create new production spec packs only when promoted into scope. |

## Cleanup Policy

1. Prefer reconciliation over deletion when a folder may contain reusable business rules.
2. Delete only when content is fully superseded and no current document links to it.
3. When a folder becomes current, add an index README and link its source user stories, API contracts, validation rules, and test strategy.
4. When a folder remains future-scope, mark that explicitly in its index before implementation starts.
