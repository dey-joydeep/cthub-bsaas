# E2E Scenarios (Playwright)

- Admin first-login → 2FA enrollment (Passkey then TOTP fallback) → recovery codes download.
- Admin step-up re-auth for tenant deletion.
- Partner owner: invite staff → staff activates → session appears → owner revokes staff session.
- Customer: booking-first → email verify → account auto-create → set password/add passkey.
- Refresh rotation & replay detection: ensure old RT is rejected.
- Flexible reset: lost 2FA → use recovery code successfully → all other sessions revoked.
