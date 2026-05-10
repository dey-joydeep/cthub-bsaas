# Customer Authentication User Stories

**Date:** 2026-05-11
**Status:** Current supporting source

## Owner Outcome

As a customer, I want low-friction sign-in, recovery, and optional strong authentication so that I can book and manage salon visits securely.

## Actors

- Customer
- Salon business
- Platform

## User Stories

### CAUTH-US-001: Customer sign-in

As a customer, I want to sign in with email/password or a supported linked provider so that I can access bookings and rewards.

### CAUTH-US-002: Optional passkey

As a customer, I want to add a passkey where supported so that future sign-in is faster and safer.

### CAUTH-US-003: Booking-first account prompt

As a customer starting a booking, I want account creation or sign-in to appear only when needed so that discovery remains low-friction.

### CAUTH-US-004: Customer recovery

As a customer, I want password reset and recovery that does not reveal whether an email exists so that my account privacy is protected.

### CAUTH-US-005: Social account linking

As a customer, I want to link or unlink Google/Meta where supported so that sign-in remains convenient without losing account access.

## Functional Requirements

- Customer sign-in issues secure first-party cookies.
- Social provider callback validates state/nonce and provider identity.
- Provider linking requires existing account policy and must prevent duplicate identities.
- Customer can unlink a provider only when another sign-in method remains.
- Reset and verification flows return generic responses where account existence would otherwise leak.

## Business Rules And Edge Cases

- Customer MFA is optional unless future policy changes.
- Social provider email must be verified or require additional verification.
- Unauthenticated social callback must not silently take over an existing local account.
- Booking-first flow must not create incomplete persistent users without verified registration completion.
- Rate limits apply to login, OTP, reset, and social callback abuse signals.

## Acceptance Criteria

- Given valid customer credentials, when sign-in succeeds, then cookies are issued and intended route is restored.
- Given provider email is unverified, when social callback completes, then additional verification or safe failure path is used.
- Given customer tries to unlink their last sign-in method, when they submit, then unlink is blocked.
- Given reset is requested for any email, then response does not disclose account existence.
