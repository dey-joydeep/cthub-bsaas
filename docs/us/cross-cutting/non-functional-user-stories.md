# Cross-Cutting Non-Functional User Stories

**Date:** 2026-05-11
**Status:** Current source

## Purpose

These user stories define non-functional expectations that apply across product areas. They should be considered during HLD, LLD, API design, UI design, test planning, and release readiness.

## User Stories

### NFR-US-001: Security by default

As a platform operator, I want secure defaults for authentication, authorization, headers, cookies, secrets, and data access so that tenant and customer data is protected.

### NFR-US-002: Tenant isolation

As a salon owner, I want my data isolated from other salons so that business privacy and trust are preserved.

### NFR-US-003: Auditability

As a salon owner or platform admin, I want sensitive actions audited so that disputes, fraud, and support investigations can be handled.

### NFR-US-004: Accessibility

As a user, I want accessible UI behavior so that keyboard, screen reader, low-vision, and mobile users can complete workflows.

### NFR-US-005: Localization

As a user, I want customer-facing and operational messages localized so that the product works across supported languages.

### NFR-US-006: Performance

As a user, I want common workflows to respond quickly so that front-desk and customer tasks do not slow down.

### NFR-US-007: Reliability

As a salon owner, I want core workflows to survive provider failures gracefully so that booking, billing, and customer service can continue.

### NFR-US-008: Observability

As a platform operator, I want logs, metrics, traces, and correlation IDs so that production issues can be diagnosed.

## Functional Requirements

- Enforce role and tenant checks server-side.
- Audit high-risk operations: auth, settings, billing, refunds, overrides, staff permissions, customer merge, stock adjustment, campaign send.
- Include correlation IDs in request/response/log flows where applicable.
- External integration failures must be surfaced without corrupting business state.
- User-facing copy must be key-based and localizable.
- Accessibility must be considered in forms, dialogs, menus, tables, calendars, and dashboards.

## Acceptance Criteria

- Given a user lacks tenant access, when they request protected data, then access is denied server-side.
- Given a refund is issued, when audit log is viewed, then actor, time, invoice, amount, reason, and correlation ID are available.
- Given a provider fails during notification send, when source booking is created, then booking remains valid and delivery failure is tracked.
- Given a modal opens, when using keyboard only, then focus is trapped and returned correctly.

## Non-Functional Requirements

- Security-sensitive code paths require test coverage.
- Tenant isolation must be included in integration tests for shared resources.
- Audit logs must avoid raw secrets, tokens, and unnecessary PII.
- Core front-desk workflows should be usable on desktop and tablet.
- Public pages should be SSR-safe.
