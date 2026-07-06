# Storybook Scenarios for Auth

**Updated:** 2025-09-11

## Screens & States

- Login: empty, typing, invalid email, invalid creds (toast), rate‑limited (cooldown), passkey available
- Forgot: empty, submitted (generic success), rate‑limited
- Reset: weak password (meter), mismatch, success
- MFA: code typing, invalid, locked
- Registration (Customer): start (email), otp, complete (meter weak/medium/strong)
- Registration (Partner): start (email/invite), profile (optional), mfa enroll
- Settings: sessions list (empty/with items), revoke (confirm), recovery issue/verify, passkey enroll/remove, email change, password change, social link/unlink

- Registration: otp timer running/expired; resend disabled/enabled; social cancel/error; invite invalid/expired/consumed
