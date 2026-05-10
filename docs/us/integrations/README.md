# External Integration User Stories

**Date:** 2026-05-11
**Status:** Current source

## Owner Outcome

As a salon owner or platform operator, I want reliable integrations for payments, messaging, email, maps, calendar, and identity providers so that the SaaS works with real-world business channels.

## Actors

- Salon Owner
- Branch Manager
- Customer
- Platform Admin
- Support Admin

## Integration Areas

- Payment gateway and UPI reference capture
- Email provider
- WhatsApp/SMS provider
- OAuth/OIDC identity providers
- Maps/geocoding
- Calendar export
- Review/deep-link channels

## User Stories

### INT-US-001: Payment integration

As a salon owner, I want payment gateway and UPI reference support so that digital payments can be captured and reconciled.

### INT-US-002: Messaging integration

As a salon owner, I want WhatsApp/SMS/email channels for reminders, receipts, campaigns, and alerts so that customers receive timely communication.

### INT-US-003: Email integration

As a platform operator, I want reliable transactional email delivery so that OTP, reset, onboarding, invoice, and reminder emails are delivered.

### INT-US-004: Maps integration

As a customer, I want accurate branch map and location data so that I can find the salon.

### INT-US-005: Calendar integration

As a customer or staff member, I want appointment calendar export so that bookings appear in personal calendars.

### INT-US-006: Identity provider integration

As a user, I want supported social or passkey-related provider flows to work safely so that sign-in remains convenient and secure.

## Functional Requirements

- Integrations must be configured per environment and, where applicable, per salon/branch.
- Provider credentials must be stored securely and never exposed to client apps.
- Integration failures must be visible to authorized users and support.
- Outbound calls should use retry/backoff where safe.
- Webhooks must validate signatures where providers support them.
- Provider-specific behavior must be hidden behind internal ports/adapters.

## Business Rules And Edge Cases

- Failed notification delivery must not block core booking or billing transactions.
- Payment capture and invoice finalization must define clear ordering and reconciliation behavior.
- Provider outages must degrade gracefully.
- Unsupported branches/providers should show configuration-required states.
- Calendar export must not expose private staff/customer notes.

## Acceptance Criteria

- Given a payment provider is configured, when a digital payment succeeds, then payment reference is linked to invoice.
- Given notification provider fails, when appointment is created, then appointment remains created and delivery failure is logged.
- Given webhook signature is invalid, when webhook arrives, then it is rejected and audited.
- Given branch has map coordinates, when public profile loads, then map/deep-link is shown.

## Non-Functional Requirements

- Integrations must be observable through logs/metrics.
- Secrets must use environment or secret-manager patterns.
- Provider adapters must be testable with mocks/fakes.
- Retry policies must avoid duplicate charges or duplicate high-impact messages.
