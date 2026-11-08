# Staff Web LLD

## Route And Screen

- Route: `/business/staff`
- Layout Architecture: **Master-Detail with Sub-Tabs**
  - **Left Master Sidebar (320px–360px)**: Real-time search input, branch filter chip, `+ New Staff` action button, and scrollable list of staff members (avatar, display name, role chips, active status badge).
  - **Right Detail Workspace**: Selected staff member header with quick summary chips, hosting **4 specialized sub-tabs**:
    1. **Profile & HR**: Display name, contact phone/email, active status, branch assignments multi-select, and confidential personal HR expansion panel (legal name, residential address, emergency contact, DOB, employment type, payout method) with a single `Save Profile` button.
    2. **Roles & Capabilities**: Business role assignment checkboxes, system role badges, and the dynamic Assigned Capabilities Guide shield with a single `Save Roles` button.
    3. **Services & Skills**: Service qualification catalog checkboxes with a single `Save Skills` button.
    4. **Schedule & Leave**: Weekly working schedule intervals with auto-inherited branch timezone (displayed as a read-only badge), active leave blocks list, and leave scheduling subform featuring a multi-line `<textarea>` reason field.
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
