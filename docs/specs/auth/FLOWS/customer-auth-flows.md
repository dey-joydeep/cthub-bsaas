# Flows — Customer

1) **Email Registration**
- Register → email OTP verification (10m TTL) → signed in.

2) **Passkeys (optional)**
- User may add a passkey and use passwordless login later.

3) **Booking-first**
- Start booking without account → verify email → account auto-created → prompt to set password/add passkey.

4) **Forgot Password (Flexible)**
- Reset link (72h TTL) → 2FA if available; **recovery code** path if device lost → revoke other sessions.
