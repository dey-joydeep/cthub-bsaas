# User Story Status Matrix

**Date:** 2026-05-11
**Status:** Consolidated documentation control matrix

## Purpose

This matrix classifies the current user-story documents under `docs/us/**`. The checklist-style drafts have been consolidated into current feature packs or removed after their content was represented in the new structure.

## Status Definitions

| Status                      | Meaning                                                                            |
| --------------------------- | ---------------------------------------------------------------------------------- |
| Current source              | Use as the direct planning source for HLD/LLD/API/UI/test work.                    |
| Current supporting source   | Current enough to use, but verify against linked specs/code before implementation. |
| Current future-scope source | Structured current doc for later product scope; not a blocker for MVP.             |
| Technical note              | Technical planning note, not a user story.                                         |

## Current Sources

| Area                         | Document                                                                                                                                               | Status                      | Notes                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------- | ---------------------------------------- |
| User-story index             | [README.md](README.md)                                                                                                                                 | Current source              | Entry point.                             |
| Authoring standard           | [user-story-template.md](user-story-template.md)                                                                                                       | Current source              | Required template for future stories.    |
| Salon owner operations       | [salon-owner/README.md](salon-owner/README.md)                                                                                                         | Current source              | Primary salon operations pack.           |
| Salon owner release planning | [salon-owner/release-scope.md](salon-owner/release-scope.md)                                                                                           | Current source              | MVP/V1/later split.                      |
| Salon owner screens          | [salon-owner/screen-map.md](salon-owner/screen-map.md)                                                                                                 | Current source              | Screen boundary map.                     |
| Salon owner backlog          | [salon-owner/backlog-map.md](salon-owner/backlog-map.md)                                                                                               | Current source              | Story IDs and downstream planning.       |
| Dashboard                    | [salon-owner/dashboard/owner-dashboard-user-stories.md](salon-owner/dashboard/owner-dashboard-user-stories.md)                                         | Current source              | Owner dashboard.                         |
| Appointments                 | [salon-owner/appointments/appointment-and-walk-in-user-stories.md](salon-owner/appointments/appointment-and-walk-in-user-stories.md)                   | Current source              | Booking, walk-ins, lifecycle.            |
| Billing/POS                  | [salon-owner/billing-pos/billing-pos-user-stories.md](salon-owner/billing-pos/billing-pos-user-stories.md)                                             | Current source              | Checkout, invoices, payments.            |
| Customer CRM                 | [salon-owner/customers/customer-crm-user-stories.md](salon-owner/customers/customer-crm-user-stories.md)                                               | Current source              | Owner-facing CRM.                        |
| Services                     | [salon-owner/services/service-catalog-user-stories.md](salon-owner/services/service-catalog-user-stories.md)                                           | Current source              | Service catalog.                         |
| Staff                        | [salon-owner/staff/staff-management-user-stories.md](salon-owner/staff/staff-management-user-stories.md)                                               | Current source              | Staff operations.                        |
| Inventory                    | [salon-owner/inventory/inventory-consumption-user-stories.md](salon-owner/inventory/inventory-consumption-user-stories.md)                             | Current source              | Stock and consumption.                   |
| Packages/Loyalty             | [salon-owner/packages-loyalty/packages-memberships-loyalty-user-stories.md](salon-owner/packages-loyalty/packages-memberships-loyalty-user-stories.md) | Current source              | Packages, memberships, points.           |
| Marketing                    | [salon-owner/marketing/customer-retention-marketing-user-stories.md](salon-owner/marketing/customer-retention-marketing-user-stories.md)               | Current source              | Retention and messaging.                 |
| Branches                     | [salon-owner/branches/branch-settings-user-stories.md](salon-owner/branches/branch-settings-user-stories.md)                                           | Current source              | Branch and salon settings.               |
| App shell                    | [app-shell/README.md](app-shell/README.md)                                                                                                             | Current source              | Header, navigation, common menus.        |
| Customer app                 | [customer-app/README.md](customer-app/README.md)                                                                                                       | Current source              | Customer-facing booking/profile/rewards. |
| Platform admin               | [platform-admin/README.md](platform-admin/README.md)                                                                                                   | Current source              | SaaS administration and support.         |
| Public discovery             | [public-discovery/README.md](public-discovery/README.md)                                                                                               | Current source              | Public search and salon profiles.        |
| Reporting                    | [reporting/README.md](reporting/README.md)                                                                                                             | Current source              | Reports and analytics.                   |
| Notifications                | [notifications/README.md](notifications/README.md)                                                                                                     | Current source              | Transactional and marketing messaging.   |
| Integrations                 | [integrations/README.md](integrations/README.md)                                                                                                       | Current source              | External providers and adapters.         |
| Portfolio                    | [portfolio/portfolio-user-story.md](portfolio/portfolio-user-story.md)                                                                                 | Current future-scope source | Portfolio and inspiration.               |
| Reputation                   | [reputation/README.md](reputation/README.md)                                                                                                           | Current source              | Reviews and reputation management.       |
| Social/community             | [social/social-user-story.md](social/social-user-story.md)                                                                                             | Current future-scope source | Community engagement.                    |
| Theme/customization          | [theme/theme-user-story.md](theme/theme-user-story.md)                                                                                                 | Current future-scope source | Branding and personalization.            |
| Account/profile              | [user/user-profile-user-story.md](user/user-profile-user-story.md)                                                                                     | Current source              | Profile, security, preferences.          |
| Data privacy                 | [data-privacy/README.md](data-privacy/README.md)                                                                                                       | Current source              | Governance, retention, export, deletion. |
| Cross-cutting NFRs           | [cross-cutting/non-functional-user-stories.md](cross-cutting/non-functional-user-stories.md)                                                           | Current source              | Security, audit, accessibility, NFRs.    |
| Project backlog map          | [project-backlog-map.md](project-backlog-map.md)                                                                                                       | Current source              | Full product coverage map.               |
| Frontend SSR                 | [technical-notes/frontend-ssr.md](technical-notes/frontend-ssr.md)                                                                                     | Technical note              | SSR expectations.                        |

## Auth Sources

| Document                                                                 | Status                    | Implementation Rule                                                             |
| ------------------------------------------------------------------------ | ------------------------- | ------------------------------------------------------------------------------- |
| [auth/README.md](auth/README.md)                                         | Current source            | Start here for Auth story navigation.                                           |
| [auth/auth-user-story.md](auth/auth-user-story.md)                       | Current supporting source | Aggregate Auth source; verify against Auth specs/code.                          |
| [auth/admin-auth-user-story.md](auth/admin-auth-user-story.md)           | Current supporting source | Admin Auth persona.                                                             |
| [auth/customer-auth-registration.md](auth/customer-auth-registration.md) | Current supporting source | Customer registration.                                                          |
| [auth/customer-auth-user-story.md](auth/customer-auth-user-story.md)     | Current supporting source | Customer sign-in/social/recovery.                                               |
| [auth/partner-auth-registration.md](auth/partner-auth-registration.md)   | Current supporting source | Partner onboarding.                                                             |
| [auth/partner-auth-user-story.md](auth/partner-auth-user-story.md)       | Current supporting source | Partner sign-in/session scenarios; verify MFA assumptions against latest specs. |

## Scope Decisions

- Salon-owner operations are the first commercial product anchor.
- Customer app, platform admin, public discovery, app shell, account/profile, reporting, notifications, integrations, data privacy, cross-cutting NFRs, and reputation are consolidated current sources.
- Portfolio, social/community, and theme/customization are current structured future-scope sources.
- Technical notes remain outside product backlog scope unless converted to a user story.
