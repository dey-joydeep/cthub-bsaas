# Email Delivery — Gmail (Nodemailer)

Use Gmail via OAuth2 (recommended) to send emails from `cthub.bsaas@gmail.com`.

## Env configuration (.env)

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=cthub.bsaas@gmail.com
EMAIL_OAUTH_CLIENT_ID=<GMAIL_CLIENT_ID>
EMAIL_OAUTH_CLIENT_SECRET=<GMAIL_CLIENT_SECRET>
EMAIL_OAUTH_REFRESH_TOKEN=<GMAIL_REFRESH_TOKEN>
# Optional if pre-fetched
EMAIL_OAUTH_ACCESS_TOKEN=<GMAIL_ACCESS_TOKEN>
EMAIL_FROM="CTHub BSAAS <cthub.bsaas@gmail.com>"

Optional (cookies across subdomains):
AUTH_COOKIE_DOMAIN=.cthub.in

## Steps to set up OAuth2
- Create a Google Cloud project and OAuth Consent Screen.
- Create OAuth 2.0 Client (type: Web/Desktop as preferred).
- Generate a Refresh Token using Google OAuth flow for the Gmail account.
- Set `EMAIL_OAUTH_CLIENT_ID`, `EMAIL_OAUTH_CLIENT_SECRET`, `EMAIL_OAUTH_REFRESH_TOKEN` in env.

## Code notes
- Adapter: `libs/server/infrastructure/src/lib/email/email.nodemailer.adapter.ts`
- Module: `libs/server/infrastructure/src/lib/email/email.module.ts` picks Nodemailer in non‑test env.
- Port: `EmailPort` (`@cthub-bsaas/server-contracts-auth`) used by auth flows.

## Test/dev behavior
- In `NODE_ENV=test`, the Console adapter logs emails to stdout instead of sending.

## Future: Email OTP
- The Prisma schema includes `EmailVerification` for OTP‑based verification.
- When implemented, the server will generate a 6‑digit OTP (TTL 10m), persist a hash, and send the OTP via this Gmail transport.
