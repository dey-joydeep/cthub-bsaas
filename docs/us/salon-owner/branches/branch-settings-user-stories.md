# Branch And Salon Settings User Stories

**Date:** 2026-05-11
**Status:** Product-owner draft

## Owner Outcome

As a salon owner, I want branch-level settings so that each location can operate with its own hours, policies, services, staff, taxes, and payment rules while still belonging to one salon business.

## Actors

- Salon Owner
- Branch Manager
- Platform Admin

## Primary Screens

- Salon profile
- Branch profile
- Business hours and holidays
- Policy settings
- Tax and payment settings
- Notification templates
- Role and access settings

## User Stories

### BR-US-001: Salon and branch profile

As a salon owner, I want to manage salon and branch profiles so that customers and staff see accurate business information.

### BR-US-002: Business hours and holidays

As a branch manager, I want to configure working hours, holidays, and special days so that booking availability is accurate.

### BR-US-003: Branch policies

As a salon owner, I want branch policies for cancellation, no-show, deposit, refund, and booking window so that operations are consistent.

### BR-US-004: Tax and payment settings

As a salon owner, I want branch-level GST/payment settings so that invoices and daily closing match local accounting needs.

### BR-US-005: Access and audit

As a salon owner, I want to control which staff can manage branch settings so that accidental or unauthorized changes are prevented.

## Functional Requirements

- Manage salon legal/display name, contact info, logo, business category, and status.
- Manage branch name, address, map location, phone, email, operating hours, holidays, and active status.
- Configure cancellation/no-show/deposit/refund rules.
- Configure tax registration, invoice prefix, payment modes, and daily closing policy.
- Configure notification templates and default channels per branch.
- Assign staff to branch and define branch-specific roles.
- Audit all setting changes.

## Business Rules And Edge Cases

- Branch deactivation must prevent new bookings but preserve historical data.
- Business-hour changes must not silently invalidate existing appointments.
- Booking window rules must apply to online booking and staff-assisted booking unless overridden.
- Tax setting changes must apply only to new invoices.
- Address/map changes may require verification before public display.
- Only owner/platform admin can change sensitive tax/payment settings unless delegated.

## Acceptance Criteria

- Given a branch is inactive, when a customer searches online booking, then that branch is not offered for new bookings.
- Given a holiday is configured, when slot search runs for that date, then no slots are shown unless a manager override exists.
- Given invoice prefix changes, when the next invoice is finalized, then the new prefix applies without changing old invoices.
- Given a manager changes cancellation policy, when the policy is saved, then the audit log records user, timestamp, old value, and new value.

## Non-Functional Requirements

- Settings changes must be audited.
- Sensitive settings require role-based authorization.
- Public branch information must be cacheable but invalidated after changes.
- Multi-branch settings must scale without duplicating configuration unnecessarily.

## HLD/LLD Hints

- Model salon-level defaults and branch-level overrides.
- Keep public profile settings separate from internal policy settings.
- Version policy settings where they affect future billing or appointments.
