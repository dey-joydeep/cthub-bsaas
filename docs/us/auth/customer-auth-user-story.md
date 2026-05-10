# Customer Authentication — User Story
**Date:** 2025-09-01  
**Status:** Draft v2 (Friction‑light, Passkeys optional, Booking‑first)

## 1) Story
As a **Customer**, I want a simple sign‑up/sign‑in and recovery flow so I can book appointments and manage my profile easily.

## 2) Assumptions
- Customer app hosted at `app.cthub.in` (configurable).  
- Modal login pattern is supported with two tabs: **Login** and **Register**.  
- Client & server validation run in tandem.

## 3) Scenarios & Acceptance Criteria (Gherkin)
### C‑1 Email sign‑up with verification
**Given** I enter email + password (or choose passkey)  
**When** I verify via **email OTP** (TTL 10m) or verification link  
**Then** my account activates and I’m signed in.

### C‑2 Passwordless / Passkeys (optional)
**Given** my device supports passkeys  
**When** I click "Login with passkey"  
**Then** I authenticate and receive AT/RT cookies; no password needed.

### C‑3 Booking‑first → account auto‑creation
**Given** I start a booking without an account  
**When** I complete contact details and verify email/phone via OTP  
**Then** an account is created, booking is linked, and I’m prompted to set password or add a passkey.

### C‑4 Password reset (flexible)
**Given** I forgot my password  
**When** I open the reset link  
**Then** if 2FA is enabled and available, complete second factor; if unavailable, use **recovery code**; else manual verification pathway.

### C‑5 Rate‑limits & copy
**Given** I exceed OTP or login attempt limits  
**Then** I see friendly, localized retry guidance and `Retry‑After`; no account existence leak.

## 4) UX
- Entry: `/login` and `/register` (or modal); localized copy about privacy & security.  
- Post‑login: redirect to **intended route** (e.g., checkout) or `/home`.

## 5) Tests
- Unit: OTP issuance/verification & edge cases.  
- E2E: booking‑first → account creation, passkey login, flexible reset.  
- Perf: p95 login < 1s (excl. email provider latency).

## Social Login (Google/Meta)

### Goals
- Offer friction-light login/sign-up for Customers using Google or Meta accounts.
- Keep security strong: PKCE, state/nonce, verified email checks, and explicit linking.

### Scenarios & Acceptance Criteria (Gherkin)
#### S-1 Social login (new user, current policy)
Given I click "Continue with Google/Meta" on the login/register modal  
When I complete the provider flow  
Then if an existing link is found, I am signed in  
And otherwise I see an i18n error `error.auth.oauth_link_required` instructing me to log in first and link in settings.

#### S-2 Social login success (existing linked)
Given my account is already linked to Google/Meta  
When I complete the provider flow  
Then I am signed in and receive AT/RT cookies  
And an audit event `oauth_callback_success` is recorded.

#### S-3 Email match with local account (not linked)
Given a local account exists with the same verified email  
When I complete the provider flow  
Then the system does not auto-link during unauthenticated callback  
And I must log in using an existing method, then link the provider in settings (or retry the provider while authenticated).

#### S-4 Linking from profile
Given I am authenticated  
When I choose to link Google/Meta  
Then after provider consent my social account is linked to my profile  
And I can unlink if another login method remains.

#### S-5 Provider denies email scope or unverified email
Given the provider does not return a verified email  
When the callback completes unauthenticated  
Then I receive `error.auth.oauth_link_required` and must log in and link explicitly  
And the email verification (OTP) path remains available for traditional sign-up flows.

### Security & Constraints
- Use OAuth 2.0/OIDC with PKCE, `state`, and `nonce`; validate ID token (`iss`,`aud`,`exp`,`nonce`).
- Only allow redirects to approved domains/paths.
- Do not rely on provider refresh tokens unless required; store tokens encrypted if stored.
- Audit: `oauth_start`, `oauth_callback_success|failure`, `oauth_link`, `oauth_unlink`.

### Provider Details
- Google: OIDC `openid email profile`, hosted discovery; use "One Tap" later (optional).
- Meta (Facebook): OAuth 2.0; request `email` scope; verify email status.

### Out of Scope (now)
- Admin/Partner social login (not required).  
- SMS-based or Apple Login.
