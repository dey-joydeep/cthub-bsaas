# Branch Settings Web LLD

## Route And Screen

- Route: `/owner/branches`
- Primary screens: branch list, branch create/edit, hours editor, holiday calendar, branch policy panel.
- Wireframes: [Branch Settings Wireframes](../WIREFRAMES/branch-settings.md).

## User Goals

- Owner or manager creates and maintains salon branches.
- Manager updates working hours and holiday exceptions.
- Owner archives inactive branches within allowed business scope.

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
