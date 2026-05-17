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
- `StaffRoleEditor`
- `StaffBranchAssignmentPanel`
- `StaffSkillMatrix`
- `StaffScheduleEditor`
- `StaffInvitationPanel`

## State And Data

- Directory supports status, branch, role, and skill filters.
- Profile edit uses tabbed sections with independent save operations.
- Invitation state is loaded separately from staff profile state.

## Controls And Validation

- Exact control behavior is defined in [Staff Validation](../VALIDATION/staff-validation.md).
- Role and branch controls hide options outside the actor permission scope.
- Schedule conflicts returned by the API are rendered next to the affected interval.

## Error Handling

- Duplicate email errors attach to email.
- Permission errors show an inline banner in the role section.
- Schedule conflict responses preserve the draft schedule and expose affected appointment count.

## Accessibility

- Skill matrix exposes service name, branch scope, and checked state to assistive technologies.
- Invitation actions include clear pending, accepted, expired, and revoked states.
