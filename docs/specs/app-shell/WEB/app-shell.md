# App Shell Web Specification

**Date:** 2026-05-18
**Status:** Current planning baseline

## Screen IDs

| Screen ID | App | Purpose |
| --- | --- | --- |
| `admin.shell.private` | Admin | Authenticated platform admin layout. |
| `partner.shell.private` | Partner | Authenticated salon owner/staff layout. |
| `customer.shell.public` | Customer | Public discovery layout. |
| `customer.shell.private` | Customer | Authenticated customer layout. |

## Component Requirements

| Component | Behavior |
| --- | --- |
| Header | Fixed or sticky according to app layout, stable height, no layout shift for counts. |
| Sidebar | Desktop partner/admin navigation; collapsible state SSR-safe. |
| Bottom navigation | Mobile customer and dense partner task shortcuts where needed. |
| Profile menu | Profile, settings, security, logout, role label. |
| Language selector | Current locale, supported locales, fallback handling. |
| Branch selector | Partner-only, visible when more than one branch is allowed. |
| Notification menu | Recent notifications, unread count, see-all route. |
| Cart/checkout entry | Contextual to Customer checkout or Partner POS. |

## State Requirements

- Loading shell context must show skeleton navigation, not privileged placeholders.
- Forbidden context must show a full-page forbidden state with a safe route action.
- Server errors must include retry and support correlation ID affordance.
- Empty notification menu must show a compact empty state.

## Accessibility

- Header controls must be keyboard reachable.
- Menus must trap focus only while open and return focus to opener.
- Icon buttons require accessible names.
- Active route must be exposed to assistive technology.
