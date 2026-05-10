# Customer Registration User Stories

**Date:** 2026-05-11
**Status:** Current supporting source

## Owner Outcome

As a customer, I want quick and safe registration so that I can book services, receive offers, and manage visits without unnecessary friction.

## Actors

- Customer
- Platform
- Salon business receiving the booking/customer relationship

## Primary Workflow

- Start registration with email.
- Verify email with OTP through an ephemeral registration session.
- Complete profile/password/consent.
- Create user only after verification and completion.

## User Stories

### CREG-US-001: OTP-first registration

As a customer, I want to verify my email before account creation completes so that abandoned sign-ups do not create unusable accounts.

### CREG-US-002: Complete registration

As a customer, I want to provide full name, password, and required consent after OTP verification so that my account is created correctly.

### CREG-US-003: Resend OTP

As a customer, I want to resend OTP after cooldown so that I can complete registration if the first email is delayed.

### CREG-US-004: Social registration

As a customer, I want to use supported social sign-in where policy allows so that registration is faster.

## Functional Requirements

- `POST /auth/register` starts registration and creates an ephemeral registration session.
- OTP TTL is 10 minutes unless config says otherwise.
- Resend is cooldown and daily-cap protected.
- No persistent `User` row is created before registration completion.
- `POST /auth/email/verify/confirm` proves email for the registration session.
- `POST /auth/register/complete` creates user, records email verification, consent, and signs in.
- Welcome notification is sent after completion.

## Business Rules And Edge Cases

- Expired registration session cannot be completed.
- OTP attempts are capped.
- New OTP invalidates or supersedes previous OTP according to implementation policy.
- `fullName` accepts Unicode letters and single spaces; server normalizes repeated spaces.
- Duplicate email conflict is checked at completion.
- Abandoned registration expires without reserving email.

## Acceptance Criteria

- Given I start registration, when OTP is sent, then I receive session ID, masked email, TTL, resend cooldown, and max attempts.
- Given I abandon registration, when the session expires, then no user exists for that abandoned attempt.
- Given I enter valid OTP and completion details, when completion succeeds, then my account is created and I am signed in.
- Given I enter invalid OTP too many times, when attempts are exhausted, then the flow is blocked according to policy.
