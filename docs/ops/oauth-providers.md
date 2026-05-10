# OAuth Providers Setup (Google/Meta)

This backend supports a pluggable OAuth adapter for Customer login. It defaults to a dev adapter (no network) for local tests. Use env to select a real provider.

## 1) Select the adapter

- In `.env` (or `.env.example`):
  - `OAUTH_ADAPTER=google` (for Google) or `OAUTH_ADAPTER=meta` (for Facebook/Meta)
  - Leave as `dev` for local unit/integration tests.

## 2) Configure provider credentials

- Google
  - `GOOGLE_CLIENT_ID=...`
  - `GOOGLE_CLIENT_SECRET=...`
  - `GOOGLE_REDIRECT_URI=https://your-domain.example.com/auth/oauth/google/callback`

- Meta (Facebook)
  - `META_CLIENT_ID=...`
  - `META_CLIENT_SECRET=...`
  - `META_REDIRECT_URI=https://your-domain.example.com/auth/oauth/meta/callback`

Notes:
- The callback path used by the controller is: `GET /auth/oauth/:provider/callback`
- Match `:provider` to `google` or `meta`
- For local testing with dev adapter: keep `OAUTH_ADAPTER=dev` (no external calls)

## 3) Frontend flows

- Start:
  - `GET /auth/oauth/:provider/start` → 302 redirect to provider with `state`
- Callback:
  - `GET /auth/oauth/:provider/callback?code=...&state=...` → issues cookies on success
- Link/unlink (when already authenticated):
  - `GET /auth/oauth/:provider/callback` with existing session → links provider account
  - `DELETE /auth/oauth/:provider` (or `POST /auth/oauth/:provider/unlink`) to unlink

## 4) Security considerations

- Verify `state`/nonce on the frontend as well (store state before redirect to mitigate CSRF).
- Enforce HTTPS for redirect URIs.
- Treat provider IDs as opaque; resolve/merge accounts by verified emails only when your policy allows.

## 5) Troubleshooting

- `oauth.*.misconfigured`: missing env vars.
- 400/401 from provider: check client/secret, redirect URI, and app status (development vs live mode).

