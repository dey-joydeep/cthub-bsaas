# Partner — Auth Registration & Onboarding (US)

**Date:** 2025-09-06
**Scope:** Owner onboarding via sessioned registration link (30-day expiry, single-use) and Staff onboarding via invite + temporary password. **Mandatory MFA (Passkey or TOTP)** pre-access.

## US-P1: Owner — Sessioned Link Onboarding

- Open link → set Password & Verify → mandatory MFA (Passkey preferred or TOTP) → success dialog → redirect Sign-in.
  **AC:** Link single-use/expiry handling with Request new link CTA; password policy; MFA gating (`mustEnrollMFA=true` until completion); i18n (en/bn/hi); accessibility; audit logs.

## US-P2: Staff — Temp Password + MFA

- Open “registration complete” link → enter Current (temp) password + New + Verify → enroll MFA → redirect Sign-in.
  **AC:** New password ≠ temp; role binding to salon + role; MFA gating same as Owner; lockout/recovery policy for repeated failures, i18n (en/bn/hi); accessibility; audit logs.

---

### Superseded on 2025-09-07 — Reasons
- Partner onboarding now **requires MFA before access** via `isMFAEnrollRequired=true`.
- Introduced **2-day reminder scheduler** until MFA enrollment completes.
- Clarified token expiry/used handling (`404/410`) and error mapping.

---

## Updated Full Spec — 2025-09-07

# Partner (Owner & Staff) — Registration / Onboarding User Story
**Date:** 2025-09-07 · **Locales:** en/bn/hi

## Owner
- Entry: **sessioned link** (30-day TTL, single use).  
- Step: Set password → API returns `{ "isMFAEnrollRequired": true }`.  
- Must enroll **Passkey or TOTP** before accessing Partner UI.  
- Email: **Setup next steps** sent upon password completion.

## Staff
- Entry: **invite** with **temp password**.  
- Step: Provide temp `currentPassword`, set new password → `{ "isMFAEnrollRequired": true }`.  
- Enroll MFA before access. Email: **Setup next steps** sent.

## Reminders (Scheduler)
Every **2 days** while `isMFAEnrollRequired=true`.  
DB fields initialized: `mfaReminderFirstAt=now()`, `mfaReminderLastAt=now()`; scheduler updates `mfaReminderLastAt` after each send.

## Errors / Status
- Token invalid → `404`; expired/used → `410`.  
- Field validation → `422`; wrong temp password → `401`; rate limit → `429`.

## Acceptance
- Cannot enter Partner UI without MFA enrollment.  
- Reminder cadence operates until enrollment.  
- Tokens are single use; audit trail captured.
