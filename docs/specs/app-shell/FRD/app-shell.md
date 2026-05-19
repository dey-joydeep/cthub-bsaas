# App Shell Functional Requirements

**Date:** 2026-05-18
**Status:** Current planning baseline

## Owner Outcome

Users must have predictable global navigation, account controls, language selection, notifications, and context selectors across Admin, Partner, and Customer apps.

## Actors

| Actor | Required shell behavior |
| --- | --- |
| Platform admin | Admin navigation, tenant/business support context, audit/support entry points. |
| Salon owner | Partner navigation, business and branch selector, operational alerts. |
| Branch manager or staff | Partner navigation constrained to assigned branches and permissions. |
| Customer | Customer navigation, bookings, profile, rewards, notifications, cart/checkout where enabled. |
| Anonymous visitor | Public navigation, language selector, login/sign-up entry. |

## Functional Requirements

| ID | Requirement |
| --- | --- |
| SHELL-FR-001 | The shell must render app-specific primary navigation from authenticated role and public route context. |
| SHELL-FR-002 | The profile menu must appear only for authenticated users. |
| SHELL-FR-003 | Logout must clear app-sensitive state and navigate to the correct public or sign-in route. |
| SHELL-FR-004 | The language selector must support configured locales and fall back to English for unsupported locale values. |
| SHELL-FR-005 | Partner shell must expose business and branch context when the actor has more than one selectable context. |
| SHELL-FR-006 | Notification entry point must show unread count without layout shift. |
| SHELL-FR-007 | Cart or checkout entry must appear only in apps and routes that support cart/checkout behavior. |
| SHELL-FR-008 | Global loading, empty, forbidden, validation, conflict, and server-error states must be visually consistent. |
| SHELL-FR-009 | Browser-only persistence for locale or collapsed navigation state must be SSR-safe. |
| SHELL-FR-010 | Navigation items hidden by permission must also be rejected by server authorization when accessed directly. |

## Business Rules

| Rule ID | Rule |
| --- | --- |
| SHELL-BR-001 | Role-specific shell state must be derived from authenticated session and authorized context, not local storage alone. |
| SHELL-BR-002 | Branch switching must clear branch-scoped page state and reload branch-scoped data. |
| SHELL-BR-003 | Unsaved changes must block context switching until the user confirms discard or saves changes. |
| SHELL-BR-004 | Transactional notifications must remain visible even when marketing notifications are disabled. |
| SHELL-BR-005 | Header counts must reserve stable layout width so counts do not shift neighboring controls. |

## Error Outcomes

| Case | Required outcome |
| --- | --- |
| Session expires | Clear private shell state and route to sign-in with return URL when safe. |
| Selected branch is revoked | Show forbidden state, clear invalid branch context, and require new selection. |
| Notification fetch fails | Show non-blocking error state in menu and keep main page usable. |
| Locale value unsupported | Fall back to English and persist the safe value. |
