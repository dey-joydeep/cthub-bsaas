# Flows — Admin

1) **First Login → 2FA Enrollment**
- Login with email/password → forced to enroll **Passkey or TOTP** → recovery codes issued → dashboard.

2) **High-risk Step-up**
- On actions like role elevation or tenant deletion → require Passkey/TOTP even if session valid.

3) **Sessions & Revocation**
- List devices (UA/IP/lastSeen); revoke other sessions (invalidate RTs).

4) **Timeouts**
- Idle: 10–15m; absolute age: 24h → re-auth required.
