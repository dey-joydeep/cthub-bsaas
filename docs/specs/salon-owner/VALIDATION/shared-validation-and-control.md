# Salon Owner Shared Validation And Control

**Date:** 2026-05-12
**Status:** Implementation baseline

## Purpose

Define shared validation ownership, control conventions, validation timing, and error behavior used by every Salon Owner MVP validation document.

## Enforcement Ownership

- Backend DTO validation is the first executable validation boundary.
- Backend service validation is authoritative for business rules, permissions, scope, conflicts, and cross-entity checks.
- Frontend validation mirrors backend rules for usability and must not be treated as a security boundary.
- OpenAPI defines transport-level request/response schema constraints.
- FRD business rules define domain validity and conflict behavior.
- Permission checks are enforced server-side even when controls are hidden or disabled in UI.
- Tests must cover backend validation directly and frontend validation where user interaction depends on it.

## Common Controls

| Data type      | UI control                               | Backend validation                                                 | Frontend validation                                                   |
| -------------- | ---------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------- |
| UUID reference | autocomplete/select with object identity | UUID format; resource belongs to tenant/business/branch scope.     | Required where specified; selected item must come from scoped lookup. |
| Short text     | text input                               | Trimmed value; min/max length; domain uniqueness where applicable. | Required/min/max where specified; trim on submit.                     |
| Long text      | textarea                                 | Max length; restricted visibility permission where applicable.     | Max length; preserve intentional internal spaces.                     |
| Phone          | tel input                                | Max 30 chars; normalized duplicate checks where applicable.        | Required where specified; max 30 chars.                               |
| Email          | email input                              | Email format where present.                                        | Email format where present.                                           |
| Money          | decimal text input                       | String decimal; scale 2; range/domain policy.                      | String decimal; two decimal places; no float math.                    |
| Quantity       | decimal text input                       | String decimal; scale 3; non-zero where movement.                  | String decimal; three decimal places.                                 |
| Percent        | decimal text input                       | String decimal; scale 2; policy range.                             | String decimal; two decimal places.                                   |
| Date           | date picker                              | ISO date; branch timezone business-day interpretation.             | ISO date.                                                             |
| Date-time      | date-time picker                         | UTC ISO string; cross-field order.                                 | Display branch-local, submit UTC ISO.                                 |
| Time           | time input                               | `HH:mm`; start before end; overlap checks.                         | `HH:mm`; start before end.                                            |
| Enum           | select or segmented control              | Value in OpenAPI enum.                                             | Value in OpenAPI enum.                                                |
| Boolean        | checkbox/switch                          | Boolean.                                                           | Boolean.                                                              |
| Multi-value    | checkbox group or multi-select           | Min items and scope checks.                                        | Min items where specified.                                            |
| Action reason  | text input or textarea                   | Required for high-risk actions; persisted in audit/event.          | Required before submit.                                               |

## Validation Timing

| Timing                 | Frontend behavior                                   | Backend behavior                                                      |
| ---------------------- | --------------------------------------------------- | --------------------------------------------------------------------- |
| Initial render         | Load defaults from route/context/server state.      | Not applicable.                                                       |
| Field blur             | Show field-level validation for touched fields.     | Not applicable.                                                       |
| Dependent field change | Clear stale dependent selections.                   | Validate final submitted references.                                  |
| Submit attempt         | Mark fields touched; block obvious invalid request. | Validate DTO, scope, permission, domain rules, transaction conflicts. |
| Server `422`           | Map field paths to controls and show summary.       | Return stable validation message keys.                                |
| Server `409`           | Show conflict panel and reload affected read model. | Return stable conflict message key and details.                       |

## Control Disablement

- Disable branch-scoped forms until a valid branch is selected.
- Disable dependent selectors until parent selections are valid.
- Disable high-risk action controls unless capability allows the action.
- Use readonly display for immutable finalized invoice data.
- Disable submit while request is in flight.
- Idempotent submit buttons remain disabled until the original response resolves or fails.

## Error Key Pattern

Use stable shared message keys:

```text
error.<feature>.<form>.<field>.<reason>
error.<feature>.<action>.<reason>
error.common.validation.required
error.common.validation.invalid_format
error.common.permission.forbidden
error.common.scope.not_found
error.common.conflict
```

Exact keys are listed in feature-specific validation files and must be added to shared message-key constants during implementation.
