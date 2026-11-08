# Staff LLD

## Backend Components

Visual flow reference:

- [Staff Roster Conflict Draw.io](../DIAGRAMS/drawio/staff-roster-conflict-flow.drawio)

- `StaffController`
- `StaffPersonalController`
- `StaffDocumentController`
- `StaffService`
- `StaffRepositoryPort`
- `StaffScheduleRepositoryPort`
- `StaffDocumentStoragePort`
- `StaffNotificationPort`
- `StaffInvitationPort`
- `AppointmentConflictPort`
- `RoleManagementController`
- `RoleService`
- `BusinessRoleRepositoryPort`
- `PermissionRepositoryPort`

## Commands And Queries

- `ListStaffQuery`
- `CreateStaffMemberCommand`
- `UpdateStaffProfileCommand`
- `UpdateStaffPersonalDetailsCommand`
- `SelfUpdateStaffContactCommand`
- `UploadStaffIdentityDocumentCommand`
- `VerifyStaffIdentityDocumentCommand`
- `GetStaffPersonalDetailsQuery`
- `UpdateStaffRolesCommand`
- `UpdateStaffBranchAssignmentsCommand`
- `UpdateStaffSkillsCommand`
- `UpdateStaffScheduleCommand`
- `ArchiveStaffMemberCommand`
- `ListBusinessRolesQuery`
- `CreateBusinessRoleCommand`
- `UpdateBusinessRoleCommand`
- `DeleteBusinessRoleCommand`
- `ListSystemPermissionsQuery`

## Persistence Models (ADR-0005 & HR Extensions)

- `PermissionMaster`: System capability definitions (`code`, `name`, `description`, `category`).
- `RoleMaster`: Global preset templates (`code`, `defaultName`, `description`, `isSystemRole`).
- `RoleMasterPermission`: Join table linking default presets to capability codes.
- `BusinessRole`: Salon business-scoped semi-master (`id`, `businessId`, `roleCode`, `name`, `description`, `isSystemDefault`, `isActive`).
- `BusinessRolePermission`: Business-specific mapping of role to capability codes.
- `StaffRoleAssignment`: Links `Staff` to assigned `BusinessRole` records.
- `StaffPersonalProfile`:
  - `staffId` (UUID, FK to Staff)
  - `legalName`: string (optional, 2–120 chars)
  - `dateOfBirth`: date string (optional)
  - `gender`: string (optional)
  - `addressLine1`, `addressLine2`, `city`, `state`, `postalCode`, `country`: structured residential address
  - `emergencyContactName`, `emergencyContactRelationship`, `emergencyContactPhone`: primary emergency contact
  - `employmentType`: enum (`FULL_TIME | PART_TIME | CONTRACTOR | APPRENTICE`)
  - `hireDate`: date string
  - `terminationDate`: date string (nullable)
  - `payoutMethod`: enum (`BANK_TRANSFER | CASH`)
  - `bankName`, `branchName`, `branchCode`, `accountType` (`ORDINARY | CURRENT`), `accountNumber`, `accountHolderName` (required when `payoutMethod === 'BANK_TRANSFER'`)
- `StaffIdentityDocument`:
  - `id`: UUID
  - `staffId`: UUID (FK)
  - `documentType`: enum (`DRIVERS_LICENSE | RESIDENCE_CARD | PASSPORT | MY_NUMBER_CARD | OTHER`)
  - `fileKey`: secure blob reference
  - `mimeType`: string (`image/jpeg | image/png | application/pdf`)
  - `fileSizeBytes`: integer (max 10MB)
  - `verificationStatus`: enum (`PENDING_VERIFICATION | VERIFIED | REJECTED`)
  - `verifiedByUserId`: UUID (nullable)
  - `verifiedAt`: ISO timestamp (nullable)
  - `rejectionReason`: string (nullable)

## Transaction Rules

- Profile, role, branch assignment, personal HR, and skill writes create audit entries.
- Role updates and invitation state changes are committed together when login access is granted.
- Schedule updates check future confirmed appointments before commit.
- `SelfUpdateStaffContactCommand` executes in a transaction: updates contact fields, writes audit log, and queues asynchronous notification to Branch Manager(s) and Owner via `StaffNotificationPort`.
- Document upload executes virus/MIME check and stores blob in encrypted storage bucket with restricted signed URLs.

## Validation Mapping

- DTO validation maps to [Staff Validation](../VALIDATION/staff-validation.md).
- Service validation verifies email uniqueness within business, branch scope, role permission, service skill scope, and schedule conflicts.
- Personal data validation checks postal code format, telephone format, date bounds (DOB in past, hire date logical), and banking field presence when `payoutMethod === 'BANK_TRANSFER'`.

## Error Mapping

- `STAFF_NOT_FOUND` returns `404`.
- `STAFF_EMAIL_DUPLICATE` returns `409`.
- `STAFF_BRANCH_SCOPE_INVALID` returns `403`.
- `STAFF_UNAUTHORIZED_FIELD_ACCESS` returns `403` (when non-manager accesses confidential HR fields or staff attempts editing locked fields).
- `STAFF_DOCUMENT_INVALID_TYPE` returns `400`.
- `STAFF_DOCUMENT_TOO_LARGE` returns `400`.
- `STAFF_SCHEDULE_CONFLICT` returns `409`.
- `STAFF_VALIDATION_FAILED` returns `400`.

## Implementation Notes

- Staff profile creation does not create application login by default.
- Login invitation creates a pending auth link and never stores temporary passwords.
- Staff archive preserves historical appointment and invoice attribution.
