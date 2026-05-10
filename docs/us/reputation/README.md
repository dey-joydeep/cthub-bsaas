# Review And Reputation User Stories

**Date:** 2026-05-11
**Status:** Current planning source

## Owner Outcome

As a salon owner, I want review collection, moderation, response, and reputation reporting so that service quality improves and public trust grows.

## Actors

- Customer
- Salon Owner
- Branch Manager
- Platform Moderator

## Primary Screens Or Workflows

- Review submission
- Review moderation queue
- Public review display
- Business response editor
- Reputation analytics

## User Stories

### REP-US-001: Eligible review

As a customer, I want to review a completed appointment so that I can share feedback about the service.

### REP-US-002: Review response

As a salon owner, I want to respond to customer reviews so that customers see their feedback is acknowledged.

### REP-US-003: Moderation

As a platform moderator or owner, I want inappropriate content flagged and reviewed so that public reviews remain trustworthy.

### REP-US-004: Reputation insights

As a salon owner, I want rating trends, response time, and common feedback themes so that I can improve operations.

## Functional Requirements

- Allow one review per eligible completed appointment.
- Support rating, optional text, optional approved photos, and category ratings where configured.
- Display public reviews with reviewer display name, service date context, rating, text, photos, and business response.
- Allow owner response with edit/delete according to policy.
- Provide moderation status: pending, approved, rejected, hidden, flagged.
- Send review request after completed visit through marketing/notification workflow.

## Business Rules And Edge Cases

- Customers cannot review cancelled/no-show appointments.
- Anonymous display may hide public name but must retain internal customer linkage.
- Review incentives must not require positive sentiment.
- Moderation should not silently delete customer feedback without a trace.
- Business response must be auditable.

## Acceptance Criteria

- Given a customer completed an appointment, when they open review link, then they can submit one review.
- Given a customer already reviewed an appointment, when they try again, then duplicate submission is blocked.
- Given a review is flagged, when public profile loads, then the flagged review follows moderation visibility rules.
- Given owner responds to a review, when the public review is shown, then the response appears with timestamp.

## Non-Functional Requirements

- Review content must be protected against XSS.
- Public rating aggregates must update consistently.
- Moderation actions must be auditable.
- Review media must be scanned/validated before public display.
