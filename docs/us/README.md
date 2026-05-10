# User Story Documentation

**Date:** 2026-05-11
**Status:** Consolidated documentation index

## Purpose

This folder contains the consolidated product user stories for the Beauty SaaS platform. The earlier checklist-style material has been folded into structured feature packs so future work starts from current, implementation-ready sources.

Use this index for HLD, LLD, functional requirements, non-functional requirements, API contracts, UI planning, QA planning, and release slicing.

## Product Areas

| Product area                 | Current source                                                            | Notes                                                                  |
| ---------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Salon owner operations       | [Salon Owner User Stories](salon-owner/README.md)                         | Primary India-first operational product pack.                          |
| Salon owner release planning | [Release Scope](salon-owner/release-scope.md)                             | MVP, V1, and later-release split.                                      |
| Salon owner screen planning  | [Screen Map](salon-owner/screen-map.md)                                   | Screen/workflow boundaries.                                            |
| Salon owner backlog mapping  | [Backlog Map](salon-owner/backlog-map.md)                                 | Story IDs and downstream HLD/LLD/API/test planning.                    |
| App shell and navigation     | [App Shell And Navigation](app-shell/README.md)                           | Header, language, profile menu, notifications, cart/checkout entry.    |
| Auth                         | [Auth User Story Index](auth/README.md)                                   | Admin, Partner, Customer auth and onboarding stories.                  |
| Customer app                 | [Customer App User Stories](customer-app/README.md)                       | Customer profile, booking, rewards, receipts, reviews.                 |
| Platform admin               | [Platform Admin User Stories](platform-admin/README.md)                   | Salon provisioning, tenant support, platform operations.               |
| Public discovery             | [Public Discovery User Stories](public-discovery/README.md)               | Public home, salon listing, profile, offers, portfolio preview.        |
| Reporting and analytics      | [Reporting And Analytics](reporting/README.md)                            | Financial, appointment, staff, customer, inventory, platform reports.  |
| Notifications                | [Notification User Stories](notifications/README.md)                      | Transactional, reminders, campaigns, templates, delivery visibility.   |
| Integrations                 | [External Integration User Stories](integrations/README.md)               | Payments, messaging, email, maps, calendar, identity providers.        |
| Portfolio                    | [Portfolio And Style Inspiration](portfolio/portfolio-user-story.md)      | Gallery, staff portfolio, inspiration, book-this-style.                |
| Reputation                   | [Review And Reputation](reputation/README.md)                             | Review eligibility, response, moderation, insights.                    |
| Social/community             | [Social And Community](social/social-user-story.md)                       | Future engagement/feed/community stories.                              |
| Theme/customization          | [Theme, Accessibility, And Personalization](theme/theme-user-story.md)    | Branding, accessibility, saved views.                                  |
| Account/profile              | [Account And Profile](user/user-profile-user-story.md)                    | Profile, security, connected accounts, privacy controls.               |
| Data privacy/governance      | [Data Privacy And Governance](data-privacy/README.md)                     | Access control, retention, export, deletion, merge governance.         |
| Cross-cutting NFRs           | [Cross-Cutting NFR Stories](cross-cutting/non-functional-user-stories.md) | Security, tenant isolation, auditability, accessibility, localization. |
| Project backlog map          | [Project User Story Backlog Map](project-backlog-map.md)                  | Full product coverage mapped to HLD planning groups.                   |
| Technical notes              | [Frontend SSR Technical Note](technical-notes/frontend-ssr.md)            | Technical note, not a product user story.                              |
| Status control               | [Status Matrix](status-matrix.md)                                         | Current source classification.                                         |
| Authoring standard           | [User Story Template](user-story-template.md)                             | Required shape for future user-story docs.                             |

## Usage Rules

- Use `docs/us/salon-owner/**` for owner operations and commercial salon workflows.
- Use the area-specific pack for customer app, platform admin, public discovery, reporting, notifications, integrations, reputation, portfolio, social/community, theme, data privacy, NFRs, and account/profile work.
- For Auth implementation, check [auth/README.md](auth/README.md) and verify behavior against `docs/specs/auth/**` and current code.
- New user-story docs must follow [user-story-template.md](user-story-template.md).
- If a feature requires multiple docs, keep them grouped under one feature folder.
