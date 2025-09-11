# Customer — Auth Registration (US)

**Date:** 2025-09-06
**Scope:** Self-registration for customers via email/password + email OTP, and via Social sign-in (Google/Meta) with deduplication and linking. Modal-based **Sign-in/Sign-up** UX in header.

## US-C1: Email/Password + OTP Registration

1. Header → Sign-in/Sign-up → Sign-up tab; enter Full Name, Email, Password, Verify Password; accept T&C/Policies.
2. Proceed (disabled until valid). Create unverified user; send 6-digit OTP (TTL 10 min, single-use, 5 attempts, 60s resend cooldown).
3. Enter OTP → Submit. On success: mark email verified, sign in (issue AT/RT + XSRF), close modal, update app state.

**AC:** Client & server validation; duplicate email error with CTA; OTP UX (masked email, countdown, resend); throttling; i18n (en/bn/hi); accessibility; audit logs.

## US-C2: Social Sign-in (Creates or Links Account)

- If provider `email_verified=true` → create/find user, mark verified, sign in (no OTP).
- If missing/unverified email → prompt email → OTP → on confirm, link provider and sign in.
- Existing account (same email) → link provider on first social sign-in (may require re-auth if risk policy flags).

**Safety rails:** Cannot unlink last method; link/unlink requires recent re-auth; deduplicate; audit.
**Business note:** Linking aids conversion/dup-prevention/support; not KYC strength.

---

### Superseded on 2025-09-07 — Reasons
- Replaced any password-first or early-user-creation flow with **OTP-first RegSession**.
- Name validation tightened to **letters + single spaces only**; no hyphens/punctuation; double spaces collapsed server-side.
- Added explicit OTP **resend cooldown & caps** and **status mapping** for `201/202/200/409/422/410/429`.
- Added **Welcome email** on successful completion.

---

## Updated Full Spec — 2025-09-07

# Customer — Registration User Story
**Date:** 2025-09-07 · **Locales:** en/bn/hi

## Goal
Create a customer account quickly and safely for bookings, coupons, and reviews.

## Flow (OTP-first; Ephemeral RegSession)
1) Start: Enter **email** → `POST /auth/register` → RegSession in Redis (TTL), OTP emailed. Response:  
   {"success": true, "data": {"sessionId":"...", "next":"otp", "otp":{"ttlSec":600,"resendAfterSec":60,"maxAttempts":5}, "maskedEmail":"a***@ex.com"}}
2) Verify: Enter OTP → `POST /auth/email/verify/confirm` with {"sessionId":"...","email":"user@example.com","code":"123456"} → {"emailVerified": true, "next": "setPassword"}.
3) Complete: Provide `fullName`, `password`, `consent` → `POST /auth/register/complete` → creates `User`, sets `isVerified=true`, `emailVerifiedAt=now()`, signs in. Welcome email.

### Resend OTP
`POST /auth/email/verify/request` → `202 Accepted` with cooldown meta; generates new OTP and resets attempts (daily caps apply).

### Abandon
Closing modal or navigating away: RegSession TTL expires; no DB `User`; email isn't reserved.

## Validation Rules
- **fullName**: 1..80, Unicode **letters + single spaces only** (`^[\p{L}]+(?:\s[\p{L}]+)*$` with `u`).  
  - Two+ spaces collapsed server-side. Any hyphens/punctuation/digits/emoji → error `auth.registration.fullName.invalidChars`.
- **email**: RFC5322, ≤254.
- **password**: 8..128; strength meter; breach check on server.
- **consent**: boolean true.

## Error & Status
- `201` register created, `202` resend, `200` verified/complete, `409` email taken (only after completion step checks), `422` field/OTP invalid, `410` expired, `429` attempts/cooldown, `500` unexpected.  
- Error shape is global (see aggregate).

## i18n keys (sample)
Labels: `auth.registration.title`, `.email.label`, `.otp.label`, `.fullName.label`, `.password.label`, `.confirmPassword.label`, `.consent.label`  
Errors: `auth.registration.fullName.invalidChars`, `auth.registration.email.invalid`, `auth.otp.invalid`, `auth.otp.expired`, `auth.otp.tooManyAttempts`, `auth.otp.resend.cooldown`  
Success: `auth.registration.otp.sent`, `auth.otp.resend.sent`, `auth.registration.completed`

## Acceptance
- OTP resend cooldown enforced; attempts reset on new code.  
- Abandon → no `User` row.  
- Name normalization and validation per rules.
