# Customer CRM User Stories

**Date:** 2026-05-11
**Status:** Product-owner draft

## Owner Outcome

As a salon owner, I want complete customer context so that staff can deliver personalized service and the business can improve repeat visits.

## Actors

- Salon Owner
- Branch Manager
- Front Desk Staff
- Service Staff
- Customer

## Primary Screens

- Customer search
- Customer profile
- Visit history
- Notes and preferences
- Segmentation list
- Consent and communication preferences

## User Stories

### CRM-US-001: Customer profile

As front desk staff, I want to find or create a customer profile quickly so that bookings, walk-ins, bills, and notes remain linked to one customer.

### CRM-US-002: Service history

As service staff, I want to see past services, formulas, allergies, preferences, and product purchases so that I can provide consistent service.

### CRM-US-003: Customer segmentation

As a salon owner, I want customer segments like new, returning, inactive, high-value, birthday month, and package expiring so that I can run targeted retention actions.

### CRM-US-004: Communication consent

As a salon owner, I want communication preferences and consent recorded so that marketing and reminders are sent responsibly.

## Functional Requirements

- Search by name, phone, email, membership/package code, or recent invoice.
- Create customer from booking, walk-in, checkout, or direct CRM entry.
- Store profile fields: name, phone, email, gender/preference if provided, date of birth optional, anniversary optional, notes, allergies, communication preferences.
- Show appointment history, invoice history, package/membership status, loyalty points, reviews, and pending dues.
- Support staff-visible service notes and restricted internal notes.
- Merge duplicate customer records with permission and audit.
- Tag customers manually and via computed segments.

## Business Rules And Edge Cases

- Phone/email uniqueness rules should be configurable because families may share phone numbers.
- Duplicate detection should suggest merge but not merge automatically.
- Sensitive notes must be role-restricted.
- Marketing messages must respect opt-out preferences.
- Customer deletion must consider invoices, appointments, audit logs, and legal retention needs.

## Acceptance Criteria

- Given a returning customer provides phone number, when I search, then I can open their profile and see last visit and pending dues.
- Given staff adds an allergy note, when another staff member opens a future appointment, then the note is visible if they have permission.
- Given two duplicate profiles exist, when an owner merges them, then appointments, invoices, packages, and notes move to the surviving profile with audit trail.
- Given a customer opted out of marketing, when a campaign segment is generated, then the customer is excluded from marketing sends but can still receive transactional reminders.

## Non-Functional Requirements

- Customer search should return common matches quickly for front desk usage.
- Profile access and changes must be auditable.
- PII must be protected by role permissions and transport security.
- Export/delete flows must be planned for privacy compliance.

## HLD/LLD Hints

- Separate customer identity from app authentication identity.
- Design customer merge carefully before building marketing automation.
- Define consent model before WhatsApp/SMS campaigns.
