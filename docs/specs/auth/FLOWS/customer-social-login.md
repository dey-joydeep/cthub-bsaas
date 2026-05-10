# Flow — Customer Social Login (Google/Meta)

1) Start
- User clicks "Continue with Google/Meta".
- Backend issues PKCE `code_verifier`, `state`, and `nonce` and redirects to provider auth URL.

2) Callback
- Provider redirects to `/auth/oauth/:provider/callback?code=...&state=...`.
- Backend validates `state`, exchanges `code` with PKCE, and validates ID token claims (`iss`,`aud`,`exp`,`nonce`).

3) Account resolution
- If a SocialAccount exists → sign in and set cookies (AT `bsaas_at`, RT `bsaas_rt`).
- Else if verified email matches a local account → auto-link (policy) or require explicit link after password login.
- Else (no account) → create Customer user and mark `emailVerifiedAt` if provider asserts verified email; otherwise queue email OTP.

4) Redirect
- Redirect to allowed `redirect` or app default; ensure cookies are set.

5) Linking/Unlinking (from profile)
- Authenticated user can link via `/auth/oauth/:provider/link/start` and unlink via `/auth/oauth/:provider/unlink`.
- Prevent unlink if it would remove the last sign-in method.

Security & Audit
- Use PKCE, `state`, and `nonce` for all flows.
- Enforce redirect allowlist.
- Audit events: `oauth_start`, `oauth_callback_success|failure`, `oauth_link`, `oauth_unlink`.
