# Branch Settings Web LLD

## Route And Screen

- Route: `/business/branches`
- Primary screens: branch list, branch create/edit, hours editor, holiday calendar, branch policy panel.
- Wireframes: [Branch Settings Wireframes](../WIREFRAMES/branch-settings.md).

## User Goals

- Owner or manager creates and maintains salon branches.
- Manager updates working hours and holiday exceptions.
- Owner archives inactive branches within allowed business scope.

## Access And Authorization

- Route gating: `roleGuard` enforces `roles: [UserRole.OWNER, UserRole.STAFF]` and `requireManagerCapability: true` on `/business/branches`.
- Allowed actors:
  - Salon Owners (`OWNER`) and Platform Admins (`ADMIN`) have inherent access to all branch settings.
  - Staff members (`STAFF`) must possess an active manager position (`isBranchManagerPosition(position)`) yielding at least one managed branch in `managedBranchIds` and `canManageBranches: true`.
- Unauthorized redirection: Authenticated users lacking manager capability are redirected to `/unauthorized`.
- Navigation visibility: The Settings navigation entry routes to `/settings` for owners/admins, `/business/branches` for branch managers, and is hidden for general non-manager staff.

## Components

- `BranchListPage`
- `BranchForm`
- `BranchHoursEditor`
- `BranchHolidayCalendar`
- `BranchPolicyPanel`
- `ArchiveBranchDialog`

## State And Data

- Branch list is filtered by status and search text.
- Branch edit screen loads profile, hours, holidays, and policy in parallel.
- Hours editor maintains a local draft until saved.

## Controls And Validation

- Exact control behavior is defined in [Branch Settings Validation](../VALIDATION/branch-settings-validation.md).
- Weekly hours use repeated day rows with open/closed toggle and interval editor.
- Archive dialog displays the server conflict message when the API rejects the status change.

## Error Handling

- Schedule overlap errors attach to the affected day row.
- Holiday conflicts attach to the selected local date.
- Archive conflicts show the server-provided branch status message.

## Accessibility

- Calendar cells include local date and open/closed status.
- Repeated day rows support keyboard editing without drag-only behavior.
