# Customer App User Stories

**Date:** 2026-05-11
**Status:** Current planning source

## Owner Outcome

As a salon customer, I want to discover salons, book services, manage appointments, review visits, and track rewards so that beauty care is convenient and trustworthy.

## Actors

- Customer
- Salon Owner
- Front Desk Staff
- Service Staff

## Primary Screens Or Workflows

- Customer dashboard
- Customer profile
- Booking flow
- Appointment history
- Favorites and preferences
- Customer rewards
- Payment and receipt history
- Review submission

## User Stories

### CUSTAPP-US-001: Customer profile

As a customer, I want to manage my profile, contact details, saved addresses, preferences, and communication settings so that salons have accurate service context.

### CUSTAPP-US-002: Book appointment

As a customer, I want to select service, branch, staff preference, date, time, and notes so that I can book without calling the salon.

### CUSTAPP-US-003: Manage appointments

As a customer, I want to view, reschedule, cancel, and track appointment status so that I stay informed about upcoming visits.

### CUSTAPP-US-004: Favorites and preferences

As a customer, I want to save favorite services, salons, branches, and staff so that repeat booking is faster.

### CUSTAPP-US-005: Rewards and referrals

As a customer, I want to see loyalty points, package balances, birthday rewards, and referral status so that I understand available benefits.

### CUSTAPP-US-006: Receipts and payments

As a customer, I want to view payment history, invoices, receipts, refunds, and dues so that I can track spend and resolve billing questions.

### CUSTAPP-US-007: Reviews

As a customer, I want to review completed appointments and see salon responses so that feedback improves service quality.

## Functional Requirements

- Customer can edit profile fields allowed by policy.
- Customer can set notification preferences for transactional and marketing communication.
- Booking flow reuses service, branch, staff, package, and cancellation rules from salon-owner docs.
- Appointment list shows upcoming, completed, cancelled, and no-show states.
- Customer can reschedule/cancel only within branch policy.
- Rewards view shows points, package sessions/value, expiry, and referral rewards.
- Reviews are available only for completed eligible appointments.

## Business Rules And Edge Cases

- Customer-facing booking must never bypass staff availability, branch hours, or service rules.
- Cancellation penalty/deposit rules must be visible before customer confirms cancellation.
- Shared phone numbers must not merge customer identities automatically.
- Marketing opt-out must not block transactional appointment reminders.
- Review editing/deletion depends on moderation policy.

## Acceptance Criteria

- Given I have an upcoming appointment, when I open customer dashboard, then appointment date, time, branch, services, staff, and actions are visible.
- Given cancellation window has passed, when I try to cancel, then the configured penalty or block is shown before confirmation.
- Given I have a package balance, when I book an eligible service, then package redemption is offered where policy allows.
- Given I completed a visit, when I open appointment history, then I can submit one review for that appointment.

## Non-Functional Requirements

- Customer app must be mobile-first and SSR-safe.
- Booking flow must be resilient against concurrent slot changes.
- Customer PII must be protected by authorization and transport security.
- All customer-visible messages must be localizable.
