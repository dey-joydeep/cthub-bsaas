# Admin Authentication — User Story
**Date:** 2025-09-01  
**Status:** Draft v2 (Passkeys/TOTP, Mandatory 2FA)

## 1) Story
As a **Platform Admin**, I need phishing‑resistant sign‑in and strong session controls so the platform remains secure even under targeted attacks.

## 2) Assumptions
- Admin app hosted at `admin.cthub.in` (configurable).  
- 2FA is **mandatory**: user must enroll **Passkey (WebAuthn)** or **TOTP** at first sign‑in.  
- Absolute session age enforced (e.g., 24h).

## 3) Scenarios & Acceptance Criteria (Gherkin)
### A‑1 First‑time sign‑in requires 2FA enrollment
**Given** an admin account without 2FA  
**When** I log in with email+password  
**Then** I am forced to enroll **Passkey** or **TOTP** before accessing the dashboard  
**And** I receive **recovery codes** and must acknowledge storage.

### A‑2 Passkey sign‑in
**Given** I have a registered passkey  
**When** I choose “Login with passkey”  
**Then** I authenticate without password and receive valid AT/RT cookies  
**And** an audit log is recorded with action `login_passkey_success`.

### A‑3 Step‑up re‑auth for high‑risk actions
**Given** I am signed in  
**When** I attempt tenant deletion, role elevation, or policy changes  
**Then** I must re‑authenticate (Passkey or TOTP) even if my session is active.

### A‑4 Active sessions & remote logout
**Given** I open “Active Sessions”  
**Then** I see device/UA/IP/lastSeen and can **log out other sessions**  
**And** affected sessions’ RTs are invalidated.

### A‑5 Idle & absolute timeouts
**Given** I’m idle beyond the admin idle timeout (e.g., 10–15 min)  
**Then** I am signed out (AT invalid) and prompted to re‑auth  
**And** after 24h absolute age I must re‑auth even if active.

### A‑6 Rate‑limiting & alerts
**Given** repeated failed logins for my admin account  
**Then** attempts are throttled with exponential backoff  
**And** after a threshold an alert is emitted to the security channel.

## 4) Error Handling
- Generic errors for invalid creds; no account enumeration.  
- On 2FA failure, show remaining attempts and cooldown; expose `Retry‑After`.  
- If passkey unavailable, offer TOTP or **recovery code** path.

## 5) UX & Navigation
- Entry: `/login` with **Passkey** button and email+password form.  
- Post‑login: `/dashboard`; after step‑up, return to originating action.

## 6) Tests
- Unit: guards (roles/tenants), services (WebAuthn/TOTP), RT rotation.  
- E2E: first‑time 2FA, passkey login, step‑up, device revoke.  
- Perf: p95 login < 800ms (excl. email latency).
