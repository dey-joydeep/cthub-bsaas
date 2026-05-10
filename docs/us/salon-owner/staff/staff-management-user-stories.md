# Staff Management User Stories

**Date:** 2026-05-11
**Status:** Product-owner draft

## Owner Outcome

As a salon owner, I want to manage staff roles, skills, shifts, attendance, and commission so that operations are secure, fair, and measurable.

## Actors

- Salon Owner
- Branch Manager
- Staff Member
- Accountant

## Primary Screens

- Staff directory
- Staff profile
- Role and permission editor
- Shift planner
- Attendance screen
- Commission report

## User Stories

### STAFF-US-001: Staff profile and role

As a salon owner, I want to create staff profiles with branch assignment, role, permissions, skills, and active status so that access and scheduling are controlled.

### STAFF-US-002: Shift and attendance

As a branch manager, I want to manage shifts, leave, attendance, and blocked time so that booking availability reflects real staffing.

### STAFF-US-003: Commission rules

As a salon owner, I want to configure commission by service, product, staff level, or branch so that payouts can be calculated transparently.

### STAFF-US-004: Staff performance

As a salon owner, I want staff performance reports by services completed, revenue, rebooking, reviews, no-shows, and utilization so that I can coach staff and plan capacity.

## Functional Requirements

- Create, invite, activate, suspend, and deactivate staff.
- Assign roles: owner, branch manager, front desk, service staff, cashier, accountant, read-only.
- Assign branch access and service skills.
- Define working hours, shifts, holidays, leave, and blocked time.
- Track attendance check-in/check-out where enabled.
- Configure commission rules and calculate commission from finalized invoices.
- Show staff calendar and workload.

## Business Rules And Edge Cases

- Deactivated staff cannot access the app but remain linked to historical appointments and invoices.
- Staff assigned to an appointment cannot be deleted.
- Commission must be recalculated or adjusted if an invoice is refunded or corrected.
- Staff availability must respect branch assignment, shift, leave, and existing bookings.
- Owner can override staff schedule with audit trail.

## Acceptance Criteria

- Given a staff member is on leave, when a booking slot is searched, then the staff member is unavailable.
- Given a service requires a skill, when staff lacks that skill, then they cannot be selected unless an authorized override is used.
- Given an invoice is finalized, when commission report is opened, then commission is calculated from actual billed line items.
- Given a staff member is suspended, when they try to sign in, then access is blocked and the event is audited.

## Non-Functional Requirements

- Role permission checks must be enforced server-side.
- Staff changes must be auditable.
- Commission calculations must be reproducible for a closed period.
- Performance reports should use finalized business records, not draft appointments.

## HLD/LLD Hints

- Model role permissions centrally.
- Separate staff identity/access from staff operational profile where needed.
- Keep commission rules versioned so historical payouts remain explainable.
