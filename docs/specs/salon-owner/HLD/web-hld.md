# Salon Owner Web HLD

**Date:** 2026-05-11
**Status:** Implementation baseline

## Purpose

Define the high-level Partner web architecture for Salon Owner MVP screens. This document translates the FRD/FNRD business model into frontend application boundaries, routing, state ownership, and security expectations.

## Business Requirement Source

The web architecture must implement:

- [Business Operating Model](../FRD/business-operating-model.md)
- [Business Rules](../FRD/business-rules.md)
- [Permissions Matrix](../FRD/permissions-matrix.md)
- [Non-Functional Requirements](../FNRD/non-functional-requirements.md)
- [OpenAPI Contract](../API/openapi.yaml)

## Primary Users

| User              | Web responsibility                                                                |
| ----------------- | --------------------------------------------------------------------------------- |
| Owner             | Business/branch control, dashboard, settings, staff, catalog, finance visibility. |
| Branch Manager    | Assigned branch operations, branch settings, schedule, staff, daily operations.   |
| Front Desk        | Appointment, walk-in, customer lookup, basic checkout workflow.                   |
| Service Staff     | Assigned appointment view, status updates, permitted customer notes.              |
| Cashier           | Checkout, invoice, payment capture, pending dues.                                 |
| Inventory Manager | Product stock, stock movement, low-stock alerts.                                  |
| Accountant        | Financial read views and reconciliation inputs.                                   |

## Context Model

Every protected Partner screen must resolve an active business context before loading feature data.

```text
AuthSession
  -> TenantContext
      -> selectedSalonBusinessId
          -> selectedBranchId | allAllowedBranches
              -> route feature state
```

Context rules:

- Owner can switch between allowed salon businesses.
- Branch-scoped users see only assigned businesses/branches.
- A selected branch is required for branch-scoped mutation flows.
- Dashboard can use all allowed branches when the role permits cross-branch reporting.
- URL deep links must be validated against the signed-in user's allowed business and branch scope.
- Stale or forbidden context must route to an access-denied or context-selection screen without loading protected feature data.

## Application Shell

The Partner shell must provide:

- authenticated session state;
- business selector for users with more than one salon business;
- branch selector for users with more than one allowed branch;
- role-aware primary navigation;
- global correlation/error handling through the web HTTP layer;
- loading, forbidden, and empty-context states;
- logout/session-expired handling from existing auth core.

## Route Groups

| Route group                        | Primary context            | Screen responsibility                                      |
| ---------------------------------- | -------------------------- | ---------------------------------------------------------- |
| `/dashboard`                       | Business or branch         | Owner/manager command center.                              |
| `/appointments`                    | Branch                     | Day board, booking, walk-ins, appointment detail.          |
| `/pos`                             | Branch                     | Checkout, invoice preview, payment capture, pending dues.  |
| `/customers`                       | Salon business             | Search, profile, notes, visit history, communication pref. |
| `/services`                        | Salon business plus branch | Service catalog, branch overrides, staff eligibility.      |
| `/staff`                           | Salon business plus branch | Staff directory, branch assignment, roles, shifts, leave.  |
| `/inventory`                       | Branch                     | Product catalog, branch stock, stock adjustment, alerts.   |
| `/settings/business`               | Salon business             | Business profile and defaults.                             |
| `/settings/business/legal`         | Salon business             | Legal/tax registration profiles.                           |
| `/settings/branches`               | Salon business             | Branch list and branch profile entry points.               |
| `/settings/branches/:branchId`     | Branch                     | Branch profile, hours, holidays, policies.                 |
| `/settings/branches/:branchId/tax` | Branch/legal registration  | Tax/payment settings where permitted.                      |

## Frontend Architecture

Use Angular standalone components and SSR-safe patterns.

Required layering:

- `libs/web/partner/**`: Partner app feature UX and route-level screens.
- `libs/web/core/auth`: current auth/session support.
- `libs/web/core/http`: API clients, interceptors, correlation/error handling.
- `libs/web/core/context`: active tenant/business/branch context services.
- `libs/web/ui`: reusable controls, tables, forms, dialogs, layout primitives.
- `libs/shared`: DTOs, message keys, and pure models shared with server when truly isomorphic.

Web code must not import server libraries.

## State Ownership

| State type               | Owner                                                                 |
| ------------------------ | --------------------------------------------------------------------- |
| Auth/session             | Web core auth.                                                        |
| Tenant/business/branch   | Web core context service.                                             |
| Route query/filter state | Route-level page component.                                           |
| Form state               | Feature form component or dialog.                                     |
| Server data              | Feature API service plus page-level loader state.                     |
| Permission capabilities  | Context/permission service derived from session and server responses. |
| Financial totals         | Server response only.                                                 |
| Booking conflict result  | Server response only.                                                 |
| Stock quantity           | Server response only.                                                 |

Optimistic UI is allowed only for low-risk local interactions. Appointment commit, invoice finalization, payment capture, stock adjustment, settings changes, staff role changes, and customer merge must wait for server confirmation.

## Route Guards

| Guard                  | Required behavior                                                        |
| ---------------------- | ------------------------------------------------------------------------ |
| `authGuard`            | Blocks unauthenticated access and preserves return URL where safe.       |
| `businessContextGuard` | Requires selected or resolvable `salonBusinessId`.                       |
| `branchContextGuard`   | Requires selected/allowed `branchId` for branch-scoped routes.           |
| `permissionGuard`      | Checks route-level capability before loading feature component data.     |
| `unsavedChangesGuard`  | Protects dirty forms for settings, service, staff, appointment, invoice. |

Guards must not replace backend authorization. They prevent poor UX and accidental navigation only.

## Data Loading

- Pages load from typed feature API services.
- List pages use pagination, search, branch filters, and loading/empty/error states.
- Detail pages reload after successful mutation.
- Dashboard loads read-model endpoints and refreshes after high-impact mutations.
- Appointment day board loads by branch and branch-local business date.
- POS checkout context is fetched from server and not reconstructed from appointment UI state.
- Branch/business context changes must clear incompatible feature state.

## UX Requirements

- Front-desk flows must minimize typing and support keyboard-heavy operation.
- Calendar/day board must be usable on desktop and tablet.
- Permission-restricted actions must be hidden when irrelevant and disabled with explanation when the user can see but cannot execute the action.
- Financial actions require confirmation, role feedback, and server-calculated totals.
- Business/branch selectors must make the active operating scope visible.
- Error messages must use shared message keys and retain correlation ID for support.

## SSR Safety

- No top-level browser API access.
- Guard `window`, `document`, `localStorage`, `ResizeObserver`, media APIs, and print APIs.
- Use Angular platform checks and lifecycle hooks.
- Partner app must not break SSR builds even when most operational flows are authenticated.
