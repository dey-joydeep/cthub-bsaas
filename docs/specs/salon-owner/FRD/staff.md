# Staff FRD

**Date:** 2026-05-12
**Status:** Implementation baseline

## Purpose

Define staff profile, role, skill, shift, and leave requirements.

## Scope

| Capability     | Requirement                                                          |
| -------------- | -------------------------------------------------------------------- |
| Staff profile  | Manage display name, contact, active status, and branch assignments. |
| Roles          | Assign operational permissions by business and branch scope.         |
| Skills         | Link staff to services they can perform.                             |
| Shifts/leave   | Define availability used by slot search and booking commit.          |
| Leave requests | Staff self-service leave requests are deferred outside MVP.          |

## Actors

- Owner
- Branch Manager
- Service Staff, own read access
- Platform Admin, support-only

## Business Rules

- Staff profile belongs to one salon business.
- Staff can be assigned to one or more branches in the same business.
- Active branch assignment is required before staff appears in branch slot search.
- Deactivated staff cannot authenticate or be assigned to new appointments.
- Staff role changes must audit old roles and new roles.
- Staff with insufficient skill must not be assigned to a service unless an authorized override is recorded.
- MVP leave handling is manager-entered leave or blocked time. Staff self-service leave request/approval workflow is not implementation scope until this FRD, validation, API, and test pack explicitly adds `PENDING`, `APPROVED`, `REJECTED`, and `CANCELLED` approval states.
- `BR-ST-06.1`: Cannot deactivate or remove the OWNER role from the last active owner of the business.
- `BR-ST-12`: Staff roles are assigned from active `BusinessRole` records belonging to the same salon business (see [ADR-0005](../../architecture/decisions/0005-database-driven-role-master-and-semi-master.md)). Role assignments persist the business role IDs.
- `BR-ST-13`: A `BusinessRole` cannot be deleted or deactivated if active staff members are currently assigned to it.
- `BR-ST-14`: Businesses may customize role display names, descriptions, and active status, and define custom roles composed of system capabilities.

## Implementation References

- HLD: [Staff HLD](../HLD/staff.md)
- LLD: [Staff LLD](../LLD/staff.md)
- Web: [Staff Web](../WEB/staff.md)
- Validation: [Staff Validation](../VALIDATION/staff-validation.md)
