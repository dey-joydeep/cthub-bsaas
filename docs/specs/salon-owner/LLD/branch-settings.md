# Branch Settings LLD

## Backend Components

Visual flow references:

- [Business/Branch Scoping And Policy Draw.io](../DIAGRAMS/drawio/business-branch-scoping-policy-flow.drawio)
- [Branch Availability Invalidation Draw.io](../DIAGRAMS/drawio/branch-availability-invalidation-flow.drawio)

- `BranchController`
- `BranchSettingsService`
- `BranchRepositoryPort`
- `BranchScheduleRepositoryPort`
- `AppointmentAvailabilityInvalidationPort`

## Commands And Queries

- `ListBranchesQuery`
- `CreateBranchCommand`
- `UpdateBranchProfileCommand`
- `UpdateBranchHoursCommand`
- `UpsertBranchHolidayCommand`
- `UpdateBranchPolicyCommand`
- `ArchiveBranchCommand`

## Transaction Rules

- Branch profile writes include audit entry in the same transaction.
- Weekly hours replace the full weekly schedule atomically.
- Holiday upsert is idempotent by branch ID and local date.

## Validation Mapping

- DTO validation maps to [Branch Settings Validation](../VALIDATION/branch-settings-validation.md).
- Service validation verifies same-business branch scope, non-overlapping working intervals, and holiday date in branch timezone.

## Error Mapping

- `BRANCH_NOT_FOUND` returns `404`.
- `BRANCH_SCOPE_MISMATCH` returns `403`.
- `BRANCH_HOURS_OVERLAP` returns `400`.
- `BRANCH_VALIDATION_FAILED` returns `400`.

## Implementation Notes

- Branch address normalization is server-side.
- Branch timezone defaults to business timezone when omitted.
- Availability cache invalidation occurs after branch hours, holiday, or status changes.
