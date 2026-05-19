# Legacy Spec Reconciliation Matrix

**Date:** 2026-05-18
**Status:** Current reconciliation baseline

## Purpose

Classify existing `docs/specs/**` folders after the project-wide documentation baseline work. This document prevents accidental implementation from older notes that overlap with newer production-ready specs.

## Status Definitions

| Status | Meaning |
| --- | --- |
| Current baseline | Use directly for planning or implementation in the documented scope. |
| Current supporting baseline | Use as shared guidance, but reconcile with feature docs before implementation. |
| Supporting legacy | May contain reusable details, but must not be the authoritative source. |
| Future-scope supporting | Keep for later product planning. Do not implement until upgraded to production-ready pack. |
| Delete candidate | Content appears fully superseded, but deletion still requires explicit user approval. |

## Current Baselines

| Folder | Status | Use |
| --- | --- | --- |
| `auth` | Current baseline | Auth backend/API/security behavior. |
| `salon-owner` | Current baseline | Salon Owner MVP operational core. |
| `shared` | Current supporting baseline | Cross-cutting standards, HLD/LLD patterns, API, security, testing, rollout. |
| `app-shell` | Current baseline | Shared web shell and navigation. |
| `account-profile` | Current baseline | User account/profile/security preferences and privacy entry points. |
| `customer-app` | Current baseline | Authenticated customer experience. |
| `public-discovery` | Current baseline | Public search, salon profile, SEO/SSR discovery. |
| `platform-admin` | Current baseline | SaaS admin, support, tenant operations. |
| `notifications` | Current baseline | Notification policy, templates, dispatch, delivery logs. |
| `integrations` | Current baseline | Provider-port architecture, configuration, webhooks, provider health. |
| `reporting` | Current baseline | Reports, metrics, exports, read models. |
| `reputation` | Current baseline | Reviews, moderation, owner replies, public visibility. |
| `data-privacy` | Current baseline | Privacy requests, retention, exports, anonymization, merge governance. |

## Legacy Or Supporting Folders

| Folder | Status | Superseding/current source | Action before implementation |
| --- | --- | --- | --- |
| `appointment` | Supporting legacy | `salon-owner` appointment FRD/HLD/LLD/API/Web/Validation/Test | Extract any missing edge case, then treat Salon Owner appointment specs as authoritative. |
| `dashboard` | Supporting legacy | `salon-owner` dashboard and `reporting` | Reconcile dashboard widgets and report metrics with current reporting rules. |
| `salon` | Supporting legacy | `salon-owner`, `public-discovery`, `platform-admin` | Split useful details into owner operations, public profile/search, or platform admin as appropriate. |
| `user` | Supporting legacy | `account-profile`, `data-privacy`, Auth specs | Reconcile profile/history/preferences docs with account-profile baseline. |
| `settings` | Supporting legacy/current mix | `account-profile`, Auth specs, `app-shell` | Keep as reference for security setting flows; move reusable rules into account-profile or Auth docs before implementation. |
| `home` | Supporting legacy | `public-discovery`, `app-shell`, `customer-app` | Reconcile public home and role dashboard ideas into current baselines. |
| `review` | Supporting legacy | `reputation` | Extract review eligibility details, then use Reputation specs as authoritative. |
| `salon-staff-request` | Supporting legacy | `salon-owner` staff and `platform-admin` provisioning/support | Reconcile staff request flow before implementation. |
| `portfolio` | Future-scope supporting | `public-discovery`, future portfolio pack | Keep for future portfolio/style inspiration planning. |
| `social` | Future-scope supporting | Future social/community pack | Keep for later product scope; not MVP. |
| `theme` | Future-scope supporting | Future theme/customization pack and app-shell | Keep for later personalization/theme work. |

## Delete-Candidate Policy

No folder is marked for automatic deletion in this pass. Several folders are likely to become delete candidates after their reusable content is extracted:

- `review`
- selected `home` docs
- selected old `appointment`, `dashboard`, and `salon` progress/status docs

Deletion requires a separate explicit approval because these folders may still contain historical notes or edge cases worth preserving.

## Implementation Rule

When starting implementation:

1. Read the current baseline first.
2. Check this matrix for legacy folders that may contain supporting details.
3. Extract only useful rules into the current baseline.
4. Do not implement directly from supporting legacy docs.
5. Update this matrix when a legacy folder is reconciled or deleted.
