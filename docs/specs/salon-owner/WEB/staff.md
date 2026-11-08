# Staff Web LLD

## Route And Screen

- Route: `/owner/staff`
- Primary screens: staff directory, staff create/edit, role assignment, branch assignment, schedule, skills.
- Wireframes: [Staff Wireframes](../WIREFRAMES/staff.md).

## User Goals

- Owner creates staff profiles and grants role-based access.
- Manager assigns staff to branches and services.
- Manager updates roster availability without breaking confirmed bookings.

## Components

- `StaffDirectoryPage`
- `StaffProfileForm`
- `StaffPersonalDetailsForm` (collapsible HR section: legal name, address, emergency contact, DOB, employment type, payout)
- `StaffIdentityDocumentUploader` (secure ID document upload & verification status card)
- `StaffSelfProfileView` (scoped self-service profile component with chain notification trigger)
- `StaffRoleEditor`
- `StaffBranchAssignmentPanel`
- `StaffSkillMatrix`
- `StaffScheduleEditor`
- `StaffInvitationPanel`

## State And Data

- Directory supports status, branch, role, and skill filters.
- Profile edit uses tabbed sections with independent save operations.
- Personal & Employment HR details are loaded within a dedicated expansion panel on the staff editor, guarded by actor capability (`canManageStaffPersonalDetails`).
- Document verification state (`PENDING_VERIFICATION`, `VERIFIED`, `REJECTED`) is displayed with status chip and uploaded timestamp.
- Invitation state is loaded separately from staff profile state.

## Controls And Validation

- Exact control behavior is defined in [Staff Validation](../VALIDATION/staff-validation.md).
- Role and branch controls hide options outside the actor permission scope.
- Personal details form dynamically renders bank details fields only when `payoutMethod === 'BANK_TRANSFER'`. When `payoutMethod === 'CASH'`, bank fields are hidden.
- Staff self-service view locks `legalName`, `dateOfBirth`, `hireDate`, `employmentType`, and `branchIds` as read-only; allows editing `phone`, `residentialAddress`, and `emergencyContact`.
- Schedule conflicts returned by the API are rendered next to the affected interval.

## Error Handling

- Duplicate email errors attach to email.
- Permission errors show an inline banner in the role section.
- Attempting to submit locked fields in self-service returns 403 `error.staff.self_edit.forbidden_fields`.
- Document upload validation verifies size <= 10MB and MIME type (`image/jpeg`, `image/png`, `application/pdf`).
- Schedule conflict responses preserve the draft schedule and expose affected appointment count.

## Accessibility

- Skill matrix exposes service name, branch scope, and checked state to assistive technologies.
- Invitation actions include clear pending, accepted, expired, and revoked states.
