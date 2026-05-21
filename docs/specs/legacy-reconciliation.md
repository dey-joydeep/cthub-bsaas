# Legacy Spec Reconciliation Matrix

**Date:** 2026-05-20
**Status:** Reconciled cleanup baseline

## Purpose

Classify existing and removed `docs/specs/**` folders after the project-wide documentation baseline work. This document prevents accidental implementation from older notes that overlap with newer production-ready specs.

## Status Definitions

| Status                       | Meaning                                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| Current baseline             | Use directly for planning or implementation in the documented scope.                             |
| Current supporting baseline  | Use as shared guidance, but reconcile with feature docs before implementation.                   |
| Removed after reconciliation | Deleted after reusable rules were moved into current baselines or confirmed already covered.     |
| Removed as legacy spec       | Deleted because product intent is preserved elsewhere and the old spec was not production-ready. |

## Current Baselines

| Folder             | Status                      | Use                                                                         |
| ------------------ | --------------------------- | --------------------------------------------------------------------------- |
| `auth`             | Current baseline            | Auth backend/API/security behavior.                                         |
| `salon-owner`      | Current baseline            | Salon Owner MVP operational core.                                           |
| `shared`           | Current supporting baseline | Cross-cutting standards, HLD/LLD patterns, API, security, testing, rollout. |
| `app-shell`        | Current baseline            | Shared web shell and navigation.                                            |
| `account-profile`  | Current baseline            | User account/profile/security preferences and privacy entry points.         |
| `customer-app`     | Current baseline            | Authenticated customer experience.                                          |
| `public-discovery` | Current baseline            | Public search, salon profile, SEO/SSR discovery.                            |
| `platform-admin`   | Current baseline            | SaaS admin, support, tenant operations.                                     |
| `notifications`    | Current baseline            | Notification policy, templates, dispatch, delivery logs.                    |
| `integrations`     | Current baseline            | Provider-port architecture, configuration, webhooks, provider health.       |
| `reporting`        | Current baseline            | Reports, metrics, exports, read models.                                     |
| `reputation`       | Current baseline            | Reviews, moderation, owner replies, public visibility.                      |
| `data-privacy`     | Current baseline            | Privacy requests, retention, exports, anonymization, merge governance.      |

## Legacy Or Supporting Folders

| Folder                | Status                       | Superseding/current source                                        | Action before implementation                                                                                                   |
| --------------------- | ---------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `appointment`         | Removed after reconciliation | `salon-owner` appointment FRD/HLD/LLD/API/Web/Validation/Test     | Reusable status/audit/notification/filtering rules were folded into Salon Owner appointment docs.                              |
| `dashboard`           | Removed after reconciliation | `salon-owner` dashboard and `reporting`                           | Placeholder component-quality notes were discarded; current dashboard/reporting rules remain authoritative.                    |
| `salon`               | Removed after reconciliation | `salon-owner`, `public-discovery`, `platform-admin`               | Public search/profile and staff/service details were folded into current specs where useful.                                   |
| `user`                | Removed after reconciliation | `account-profile`, `data-privacy`, Auth specs                     | Optional profile-field scope was folded into Account/Profile; placeholder API/status notes were discarded.                     |
| `settings`            | Removed after reconciliation | `account-profile`, Auth specs, `app-shell`                        | Security settings remain owned by Auth and Account/Profile; old per-app duplicates were removed.                               |
| `home`                | Removed after reconciliation | `public-discovery`, `app-shell`, `customer-app`                   | Public home/search and featured-content intent is represented by Public Discovery, Customer App, and App Shell docs.           |
| `review`              | Removed after reconciliation | `reputation`                                                      | Review eligibility, newest-first listing, aggregate rating/count, and production-data rules were folded into Reputation.       |
| `salon-staff-request` | Removed after reconciliation | `salon-owner` staff and `platform-admin` provisioning/support     | Staff leave request workflow remains deferred outside MVP; manager-entered leave/block time remains in Salon Owner staff docs. |
| `portfolio`           | Removed as legacy spec       | `docs/us/portfolio/**`, `public-discovery`, future portfolio pack | Product intent remains in user stories; no production technical spec exists until future-scope portfolio planning is promoted. |
| `social`              | Removed as legacy spec       | `docs/us/social/**`, future social/community pack                 | Product intent remains in user stories; no production technical spec exists until future social planning is promoted.          |
| `theme`               | Removed as legacy spec       | `docs/us/theme/**`, `app-shell`, future theme/customization pack  | Product intent remains in user stories; no production technical spec exists until future theme planning is promoted.           |

## Cleanup Result

The legacy folders listed above were removed after reconciliation because their reusable content was either already represented in current production-level docs, folded into the current docs in this cleanup, or preserved as future-scope user-story intent.

Removed legacy folders:

- `appointment`
- `dashboard`
- `salon`
- `user`
- `settings`
- `home`
- `review`
- `salon-staff-request`
- `portfolio`
- `social`
- `theme`

## Implementation Rule

When starting implementation:

1. Read the current baseline first.
2. Use removed legacy folders only through git history when investigating historical context.
3. Do not restore removed legacy docs as implementation sources.
4. If a future-scope area is promoted, create a production-ready spec pack under `docs/specs/<feature>` using the production documentation standard.
5. Update this matrix when a new legacy folder is reconciled, removed, or promoted.
