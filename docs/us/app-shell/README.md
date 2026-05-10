# App Shell And Navigation User Stories

**Date:** 2026-05-11
**Status:** Current planning source

## Owner Outcome

As a user of any app, I want consistent navigation, account controls, language selection, notifications, and cart/checkout entry points so that common actions are predictable across Admin, Partner, and Customer experiences.

## Actors

- Salon Owner
- Staff
- Customer
- Platform Admin

## Primary Screens Or Workflows

- Header/top navigation
- Profile/account menu
- Notification menu
- Cart or checkout entry
- Language selector
- Auth modal entry

## User Stories

### SHELL-US-001: Shared header

As a user, I want the app header to expose brand identity and common actions so that I can navigate without learning a different pattern on every screen.

### SHELL-US-002: Language selection

As a user, I want to select a supported language so that labels and messages are understandable to me.

### SHELL-US-003: Profile menu

As an authenticated user, I want profile, settings, and logout controls in one menu so that account actions are easy to find.

### SHELL-US-004: Notification menu

As an authenticated user, I want recent notifications and unread counts so that I can react to important events quickly.

### SHELL-US-005: Cart and checkout entry

As a customer or front-desk user, I want a clear cart/checkout entry point so that selected products, services, or packages can be reviewed before payment.

## Functional Requirements

- Show logo and app-specific primary navigation.
- Show language selector using active locales and a safe default.
- Persist language preference in a browser-safe way.
- Show profile menu only when authenticated.
- Show unread notification count and last ten notifications.
- Provide a "see all" navigation when more notifications exist.
- Show cart count and item summary where the current app supports cart/checkout.
- Open login/sign-up modal or route when unauthenticated user chooses auth entry.

## Business Rules And Edge Cases

- Browser-only persistence must be SSR-safe.
- Logout must clear app state and navigate to the correct sign-in or public route.
- Notification and cart counts must not cause layout shifts.
- Language fallback is English when locale is unsupported.
- Cart behavior depends on app context; Partner POS and Customer checkout may diverge.

## Acceptance Criteria

- Given I am unauthenticated, when I open the header, then I see login/sign-up and no profile menu.
- Given I am authenticated, when I open the profile menu, then settings and logout are available.
- Given there are unread notifications, when the header renders, then the unread count is visible.
- Given I select a supported language, when I reload, then the selected language remains active.
- Given cart has items, when I open cart menu, then item name, price, quantity, remove action, and total are visible where cart is enabled.

## Non-Functional Requirements

- Header must be keyboard accessible.
- Menus must have correct ARIA roles and focus management.
- Header must work under SSR without top-level browser API access.
- Text must fit on mobile, tablet, and desktop.
