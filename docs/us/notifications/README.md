# Notification User Stories

**Date:** 2026-05-11
**Status:** Current source

## Owner Outcome

As a salon owner and platform operator, I want transactional and marketing notifications to be reliable, configurable, and consent-aware so that customers and staff receive the right message at the right time.

## Actors

- Salon Owner
- Branch Manager
- Staff
- Customer
- Platform Admin

## Notification Types

- OTP and verification
- Password reset and security alerts
- Appointment confirmation, reminder, reschedule, cancellation
- Invoice and payment receipt
- Package/membership expiry
- Review request
- Staff invite and MFA reminder
- Campaign and offer
- System/admin alert

## User Stories

### NOTIF-US-001: Transactional notification

As a user, I want critical account, booking, and payment messages delivered reliably so that I can complete important workflows.

### NOTIF-US-002: Reminder automation

As a salon owner, I want configurable reminders for appointments, package expiry, and review requests so that manual follow-up is reduced.

### NOTIF-US-003: Consent-aware marketing

As a customer, I want marketing messages to respect my preferences so that I receive only permitted promotional communication.

### NOTIF-US-004: Template management

As a salon owner or platform admin, I want templates with safe variables so that messages are consistent and localized.

### NOTIF-US-005: Delivery visibility

As an owner or support admin, I want delivery status and failures visible so that communication issues can be resolved.

## Functional Requirements

- Support email, in-app, and configurable external channels such as WhatsApp/SMS.
- Separate transactional and marketing notification policy.
- Support templates with localization keys and approved variables.
- Store send attempts, provider response, status, and retry count.
- Provide unsubscribe/opt-out behavior for marketing channels.
- Allow branch-level notification settings where appropriate.

## Business Rules And Edge Cases

- Transactional messages may be required even when marketing opt-out is enabled.
- OTP/security messages must not leak sensitive data.
- Duplicate reminders must be prevented for the same event/window.
- Template variable rendering must escape unsafe content.
- Provider failure must not corrupt the source business transaction.

## Acceptance Criteria

- Given an appointment is confirmed, when notification rules are enabled, then confirmation message is queued.
- Given customer opted out of marketing, when a campaign is sent, then the customer is excluded.
- Given a template has an invalid variable, when saving, then validation blocks it.
- Given provider delivery fails, when support views delivery log, then failure reason and retry status are visible.

## Non-Functional Requirements

- Notification sending must be asynchronous.
- High-volume sends must be rate-limited.
- Delivery logs must be searchable by correlation ID where available.
- Sensitive content must not be logged in full.
