# App Shell Test Specification

**Date:** 2026-05-18
**Status:** Current planning baseline

## Backend Tests

- `getShellContext` returns only authorized navigation/scope data.
- Branch context rejects forbidden branch IDs.
- Locale preference rejects unsupported locale values.

## Web Tests

- Anonymous shell hides profile menu and private navigation.
- Authenticated shell shows role-appropriate navigation.
- Partner branch selector appears only with selectable branches.
- Branch switch clears branch-scoped page state.
- Unsaved changes block branch switch until confirmation.
- Logout clears private app state.
- Menus manage focus and keyboard behavior.
- SSR render does not access browser-only APIs.

## E2E Candidates

- Partner login to shell, branch switch, logout.
- Customer public shell to login entry.
- Admin shell loads without partner/customer navigation.
