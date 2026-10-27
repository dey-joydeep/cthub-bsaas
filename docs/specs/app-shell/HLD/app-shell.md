# App Shell HLD

**Date:** 2026-05-18
**Status:** Current planning baseline

## Architecture Boundary

The app shell is a web-layer capability shared by Admin, Partner, and Customer apps. It owns layout composition, navigation display, global context controls, and global UI feedback. It must not own feature business rules.

## Dependencies

| Dependency                     | Use                                                           |
| ------------------------------ | ------------------------------------------------------------- |
| Auth/session context           | Determine authenticated state, actor roles, and profile menu. |
| RBAC baseline                  | Hide or disable navigation based on allowed operations.       |
| Tenant/business/branch scoping | Populate partner business/branch selector.                    |
| Notification feature           | Show unread count and recent notifications.                   |
| Cart/POS/checkout features     | Show cart or checkout entry where supported.                  |
| i18n                           | Resolve language and localized labels.                        |

## Route Groups

| App      | Public shell                              | Private shell                                                     |
| -------- | ----------------------------------------- | ----------------------------------------------------------------- |
| Admin    | Login and password recovery.              | Platform admin dashboard, tenant/business review, support, audit. |
| Partner  | Login, registration completion, recovery. | Salon owner/staff operations with business/branch context.        |
| Customer | Public discovery, login, registration.    | Customer bookings, profile, rewards, notifications.               |

## State Ownership

- Session state belongs to web auth/core services.
- Business/branch selection belongs to app shell context store.
- Page-specific filters belong to feature pages.
- Locale belongs to i18n/web config layer.
- Notification count belongs to notification client service.

## Security And SSR

- Browser APIs must be guarded.
- Server-rendered shell must not expose private state for anonymous users.
- Hydration must not create visible role flicker with privileged navigation.
- Server remains authoritative for every protected route.

## Diagram

See [app-shell-state-flow.drawio](../DIAGRAMS/app-shell-state-flow.drawio).
