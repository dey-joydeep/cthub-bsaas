# Project User Story Backlog Map

**Date:** 2026-05-11
**Status:** Current source

## Purpose

This document maps the full project user-story coverage into implementation-planning groups. Use it after reading `docs/us/README.md` when deciding what HLD/LLD/API/test work to do next.

## Product Coverage

| Planning group                      | Source docs                                            |
| ----------------------------------- | ------------------------------------------------------ |
| Salon owner operations              | `docs/us/salon-owner/**`                               |
| Customer app                        | `docs/us/customer-app/README.md`                       |
| Platform administration             | `docs/us/platform-admin/README.md`                     |
| Public discovery                    | `docs/us/public-discovery/README.md`                   |
| Authentication and authorization    | `docs/us/auth/**`                                      |
| App shell/common UX                 | `docs/us/app-shell/README.md`                          |
| Account/profile                     | `docs/us/user/user-profile-user-story.md`              |
| Reporting and analytics             | `docs/us/reporting/README.md`                          |
| Notifications                       | `docs/us/notifications/README.md`                      |
| Integrations                        | `docs/us/integrations/README.md`                       |
| Reputation/reviews                  | `docs/us/reputation/README.md`                         |
| Portfolio/style inspiration         | `docs/us/portfolio/portfolio-user-story.md`            |
| Theme/accessibility/personalization | `docs/us/theme/theme-user-story.md`                    |
| Social/community                    | `docs/us/social/social-user-story.md`                  |
| Data privacy/governance             | `docs/us/data-privacy/README.md`                       |
| Cross-cutting NFRs                  | `docs/us/cross-cutting/non-functional-user-stories.md` |

## HLD Packages

| HLD package                 | Primary sources                                                        |
| --------------------------- | ---------------------------------------------------------------------- |
| Salon Operations HLD        | Salon owner dashboard, appointments, services, staff, branch settings  |
| Finance And POS HLD         | Billing/POS, packages/loyalty, reporting, integrations                 |
| Customer Experience HLD     | Customer app, public discovery, reputation, portfolio, account/profile |
| Platform Administration HLD | Platform admin, auth, data privacy, reporting                          |
| Messaging And Marketing HLD | Notifications, marketing/retention, integrations, data privacy         |
| Inventory HLD               | Inventory, services, billing/POS, reporting                            |
| Security And Governance HLD | Auth, cross-cutting NFRs, data privacy, platform admin                 |

## Completion Definition For US Layer

The US layer is considered complete when:

- every product area has a current source document;
- old checklist sources are either consolidated or removed;
- every current source has user stories, functional requirements, rules/edge cases, acceptance criteria, and NFRs where relevant;
- root navigation and status matrix point only to existing files;
- local Markdown links resolve;
- `git diff --check` passes.
