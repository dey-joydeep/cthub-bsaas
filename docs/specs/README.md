# Technical Specs Index

**Updated:** 2026-05-18

This folder contains current implementation baselines and older supporting specifications. A spec folder must be treated according to its status below before it is used for new implementation.

## Current Baselines

| Area | Status | Notes |
| --- | --- | --- |
| [auth](auth/README.md) | Current implementation baseline | Auth backend is implemented against the OpenAPI route contract. Keep OpenAPI, API HLD/LLD, frontend service contracts, and server-alignment docs synchronized. |
| [salon-owner](salon-owner/README.md) | Current implementation-planning baseline | Use this for Salon Owner MVP implementation planning across FRD, FNRD, HLD, LLD, API, Web, Validation, Test, wireframes, and diagrams. |
| [shared](shared/hld-baselines.md) | Current supporting baseline | Shared HLD/LLD patterns may be used when consistent with active feature specs. |
| [app-shell](app-shell/README.md) | Current planning baseline | Shared shell, navigation, context selector, global feedback, validation, tests, and wireframe notes. |
| [account-profile](account-profile/README.md) | Current planning baseline | Account/profile, security settings integration, preferences, privacy entry points, validation, tests, and wireframe notes. |

## Supporting Or Legacy Specs

These folders predate the Salon Owner MVP baseline or cover product areas that are not currently the active implementation baseline. Do not delete or implement from them blindly. Reconcile them against the current user stories and active specs first.

| Area | Status | Cleanup rule |
| --- | --- | --- |
| `appointment` | Supporting legacy spec | Compare against `salon-owner` appointment FRD/HLD/LLD before reuse. |
| `dashboard` | Supporting legacy spec | Compare against `salon-owner` dashboard FRD/HLD/LLD before reuse. |
| `salon` | Supporting legacy spec | Compare against `salon-owner` business, branch, staff, and service-catalog specs before reuse. |
| `user` | Supporting legacy spec | Reconcile with `account-profile` and Auth settings specs before implementation. |
| `settings` | Supporting current/legacy mix | Reconcile with Auth and `account-profile` before implementation. |
| `home`, `portfolio`, `review`, `social`, `theme` | Future or supporting product specs | Keep as supporting material until their product areas receive production-grade HLD/LLD/API/Web/Test packs. |
| `salon-staff-request` | Supporting legacy spec | Reconcile with Salon Owner staff and branch access rules before implementation. |

## Cleanup Policy

1. Prefer reconciliation over deletion when a folder may contain reusable business rules.
2. Delete only when content is fully superseded and no current document links to it.
3. When a folder becomes current, add an index README and link its source user stories, API contracts, validation rules, and test strategy.
4. When a folder remains future-scope, mark that explicitly in its index before implementation starts.
