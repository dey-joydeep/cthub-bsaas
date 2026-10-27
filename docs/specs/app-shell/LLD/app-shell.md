# App Shell LLD

**Date:** 2026-05-18
**Status:** Current planning baseline

## Suggested Web Modules

| Module                  | Responsibility                                                             |
| ----------------------- | -------------------------------------------------------------------------- |
| `web-core-shell`        | Shell context, navigation model, route layout helpers.                     |
| `web-ui-shell`          | Header, sidebar, menus, branch selector, global feedback components.       |
| App-specific shell libs | Admin, Partner, and Customer route composition and navigation definitions. |

## Core Models

| Model                      | Fields                                                                    |
| -------------------------- | ------------------------------------------------------------------------- |
| `ShellSessionModel`        | `isAuthenticated`, `userId`, `displayName`, `roles`, `activeApp`.         |
| `ShellContextModel`        | `tenantId`, `businessId`, `branchId`, `availableBranches`, `permissions`. |
| `ShellNavigationItemModel` | `id`, `labelKey`, `route`, `icon`, `requiredPermission`, `children`.      |
| `GlobalFeedbackModel`      | `kind`, `messageKey`, `correlationId`, `retryAction`.                     |

## Service Contracts

| Service                   | Methods                                                            |
| ------------------------- | ------------------------------------------------------------------ |
| `ShellContextService`     | `loadContext()`, `setBusiness()`, `setBranch()`, `clearContext()`. |
| `ShellNavigationService`  | `getNavigation(app, context)`, `canShow(item, permissions)`.       |
| `LocalePreferenceService` | `getActiveLocale()`, `setLocale(locale)`.                          |
| `GlobalFeedbackService`   | `showError(error)`, `showConflict(error)`, `clear()`.              |

## Context Switch Sequence

1. User selects a new branch.
2. Shell checks for unsaved changes through registered page guard.
3. If blocked, shell opens confirmation dialog.
4. On confirmation, shell updates branch context.
5. Feature page stores clear branch-scoped data.
6. Current route reloads or redirects to safe branch landing page.

## Error Handling

- API errors must show localized message by error code.
- Correlation ID must be visible in detailed error affordance for support.
- Forbidden shell context must route to a safe landing page or forbidden screen.

## Test Implications

Tests must cover route guard behavior, permission-filtered navigation, branch switch state clearing, SSR-safe locale persistence, and logout cleanup.
