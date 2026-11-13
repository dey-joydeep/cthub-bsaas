# Staff HLD

## Purpose

Staff manages employees, contractors, branch assignments, roles, working schedules, service skills, and commission inputs.

## Architecture Scope

- Owns staff profile, employment status, personal HR details, identity verification, emergency contacts, branch assignments, skill mappings, and roster availability.
- Integrates with appointment booking for resource availability.
- Integrates with POS for performer attribution and commission reporting.
- Publishes upward chain notifications to Branch Managers and Owners when staff self-update contact or emergency info.

## Dependencies

- Branch Settings provides assignable branches and branch hours.
- Service Catalog provides services that can be assigned as staff skills.
- Auth provides platform user linkage when staff members receive login access.
- Audit logging records role, status, personal info, compensation, and schedule changes.
- Notification service dispatches manager-chain alerts for self-service updates.
- Secure Storage provides encrypted blob storage for staff proof of identity documents.

## Data Ownership

- `StaffMember` belongs to one business and can be assigned to multiple branches within that business.
- Login identity is optional and linked through auth user ID only after invitation acceptance.
- Staff skill records define which services the staff member can perform and the effective branch scope.
- Personal & Employment records:
  - `legalName`, `dateOfBirth`, `gender` (optional).
  - `residentialAddress`: structured street, city, state, postal code.
  - `emergencyContact`: primary contact name, relationship, phone.
  - `employmentType`: `FULL_TIME`, `PART_TIME`, `CONTRACTOR`, `APPRENTICE`.
  - `hireDate` and optional `terminationDate`.
  - `payoutMethod`: `BANK_TRANSFER` (with bank/branch/account details) or `CASH`.
  - `identityDocuments`: document type, secure file URL, verification status (`PENDING_VERIFICATION`, `VERIFIED`, `REJECTED`), verifiedBy, verifiedAt.

## Integration Points

- API operations are listed in [API endpoint map](../API/endpoint-map.md#staff).
- Detailed commands and transactions are defined in [Staff LLD](../LLD/staff.md).
- Screen behavior is defined in [Staff Web LLD](../WEB/staff.md).
- Validation rules are defined in [Staff Validation](../VALIDATION/staff-validation.md).

## Events

- `StaffMemberCreated`
- `StaffMemberUpdated`
- `StaffPersonalProfileUpdated`
- `StaffSelfContactUpdated`
- `StaffIdentityDocumentUploaded`
- `StaffIdentityDocumentVerified`
- `StaffRoleChanged`
- `StaffBranchAssignmentChanged`
- `StaffScheduleUpdated`
- `StaffStatusChanged`

## Security And Consistency

- Staff records never grant application access by profile creation alone; invitation acceptance activates auth access.
- Staff assignment cannot reference a branch outside the owning business.
- Roster updates must not invalidate future confirmed appointments without an explicit conflict resolution path.
- Personal data boundary: Residential addresses, emergency contacts, date of birth, and identity documents are classified as **Confidential HR Data**. Public APIs and general staff endpoints MUST omit these fields. They are accessible only to the business `OWNER`, authorized `BRANCH_MANAGER` (for assigned branch staff), and the staff member themselves via their private profile.
- Self-service modification of contact details (phone, address, emergency contact) triggers `StaffSelfContactUpdated`, publishing an audit event and dispatching a chain notification to branch managers and the salon owner.
