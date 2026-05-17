# Staff HLD

## Purpose

Staff manages employees, contractors, branch assignments, roles, working schedules, service skills, and commission inputs.

## Architecture Scope

- Owns staff profile, employment status, branch assignments, skill mappings, and roster availability.
- Integrates with appointment booking for resource availability.
- Integrates with POS for performer attribution and commission reporting.

## Dependencies

- Branch Settings provides assignable branches and branch hours.
- Service Catalog provides services that can be assigned as staff skills.
- Auth provides platform user linkage when staff members receive login access.
- Audit logging records role, status, compensation, and schedule changes.

## Data Ownership

- `StaffMember` belongs to one business and can be assigned to multiple branches within that business.
- Login identity is optional and linked through auth user ID only after invitation acceptance.
- Staff skill records define which services the staff member can perform and the effective branch scope.

## Integration Points

- API operations are listed in [API endpoint map](../API/endpoint-map.md#staff).
- Detailed commands and transactions are defined in [Staff LLD](../LLD/staff.md).
- Screen behavior is defined in [Staff Web LLD](../WEB/staff.md).
- Validation rules are defined in [Staff Validation](../VALIDATION/staff-validation.md).

## Events

- `StaffMemberCreated`
- `StaffMemberUpdated`
- `StaffRoleChanged`
- `StaffBranchAssignmentChanged`
- `StaffScheduleUpdated`
- `StaffStatusChanged`

## Security And Consistency

- Staff records never grant application access by profile creation alone; invitation acceptance activates auth access.
- Staff assignment cannot reference a branch outside the owning business.
- Roster updates must not invalidate future confirmed appointments without an explicit conflict resolution path.
