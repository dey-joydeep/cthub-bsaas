# Customer Retention And Marketing User Stories

**Date:** 2026-05-11
**Status:** Product-owner draft

## Owner Outcome

As a salon owner, I want automated reminders and targeted campaigns so that customers come back, reviews improve, and staff spends less time manually following up.

## Actors

- Salon Owner
- Branch Manager
- Marketing Staff
- Customer

## Primary Screens

- Campaign list
- Campaign builder
- Audience segment selector
- Notification template editor
- Delivery report
- Review request workflow

## User Stories

### MKT-US-001: Appointment reminders

As a salon owner, I want automated appointment reminders so that no-shows and late arrivals are reduced.

### MKT-US-002: Review request

As a salon owner, I want review requests after completed visits so that satisfied customers are encouraged to leave feedback.

### MKT-US-003: Win-back campaign

As a salon owner, I want to target inactive customers with offers so that repeat visits increase.

### MKT-US-004: Birthday and anniversary campaign

As a salon owner, I want birthday and anniversary offers so that customers feel recognized and return.

### MKT-US-005: Package expiry reminder

As a salon owner, I want package and membership expiry reminders so that customers redeem benefits before expiry.

## Functional Requirements

- Support transactional reminders for booking confirmation, reminder, reschedule, cancellation, payment receipt, and package expiry.
- Support marketing campaigns by segment: inactive, high-value, birthday month, package expiring, service interest, branch.
- Support channels: email, in-app, WhatsApp/SMS when configured.
- Provide template variables for customer name, branch, appointment time, service, staff, package balance, offer code.
- Track delivery status, opt-out, failure, click/open where provider supports it.
- Respect customer consent and communication preferences.

## Business Rules And Edge Cases

- Transactional reminders may be sent even if marketing is disabled, subject to legal/policy rules.
- Marketing messages must exclude opted-out customers.
- Campaign send time should respect branch/customer timezone.
- Failed message delivery should not block booking or checkout.
- Offer codes must have validity, redemption limit, branch scope, and audit.
- Review request should be sent only for completed visits and not repeatedly for the same appointment.

## Acceptance Criteria

- Given a customer has a confirmed appointment tomorrow, when reminder schedule runs, then the customer receives the configured reminder if channel consent allows it.
- Given a customer opted out of marketing, when a win-back campaign is sent, then the customer is excluded.
- Given a visit is completed, when review request automation runs, then one review request is sent for that visit.
- Given a package expires in 7 days, when expiry reminder rule runs, then the customer receives a reminder with remaining balance.

## Non-Functional Requirements

- Campaign sends must be asynchronous and retryable.
- Message templates must be auditable.
- Bulk sends must be rate-limited to avoid provider abuse or unexpected cost.
- Delivery failures must be visible to owner/manager.

## HLD/LLD Hints

- Separate transactional notification engine from marketing campaign engine.
- Model consent and channel capability before adding provider adapters.
- Keep provider integrations behind ports/adapters.
