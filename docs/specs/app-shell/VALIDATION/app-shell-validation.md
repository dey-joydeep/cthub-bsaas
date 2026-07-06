# App Shell Validation And Controls

**Date:** 2026-05-18
**Status:** Current planning baseline

## Forms And Controls

| Form/control ID                       | Fields                   | Submit/action                          |
| ------------------------------------- | ------------------------ | -------------------------------------- |
| `shell.locale-selector`               | `locale`                 | Update locale preference.              |
| `shell.branch-selector`               | `businessId`, `branchId` | Switch active branch context.          |
| `shell.logout-confirm`                | confirmation only        | Logout.                                |
| `shell.unsaved-context-switch-dialog` | confirmation only        | Discard page state and switch context. |

## Validation Rules

| Rule ID       | Control         | Rule                                                                          | Error key                             |
| ------------- | --------------- | ----------------------------------------------------------------------------- | ------------------------------------- |
| SHELL-VAL-001 | Locale selector | Locale must be one of configured supported locales.                           | `shell.validation.locale_unsupported` |
| SHELL-VAL-002 | Branch selector | Branch must belong to selected business and actor scope.                      | `shell.validation.branch_forbidden`   |
| SHELL-VAL-003 | Branch selector | Branch switch is blocked while page has unsaved changes unless user confirms. | `shell.validation.unsaved_changes`    |
| SHELL-VAL-004 | Logout          | Logout action must be disabled while logout request is in progress.           | `shell.validation.logout_in_progress` |

## Backend Enforcement

The server must validate locale and branch context. Frontend validation is a UX mirror only.

## Test Mapping

- `SHELL-VAL-001`: unsupported locale falls back or returns validation error.
- `SHELL-VAL-002`: branch outside scope is rejected.
- `SHELL-VAL-003`: unsaved changes dialog blocks branch switch.
- `SHELL-VAL-004`: repeated logout does not create duplicate calls.
