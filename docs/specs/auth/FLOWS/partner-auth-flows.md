# Flows — Partner (Owner & Staff)

Endpoints (implemented)
- Owner validate: `GET /auth/owner/registration/:token`
- Owner complete: `POST /auth/owner/registration/complete`
- Staff validate: `GET /auth/staff/registration/:token`
- Staff complete: `POST /auth/staff/registration/complete`

1) **Owner 2FA Prompt**
- Until Owner enrolls 2FA, show non-dismissable banner.

2) **Staff Invitation**
- Owner sends invite → single-use link → set password (+ optional 2FA) → login.

3) **Owner Device Control**
- Owner can revoke own or staff sessions within tenant (audited).

4) **Read-only Customer Preview (optional)**
- Staff with permission can preview Customer app in read-only SSO session.
