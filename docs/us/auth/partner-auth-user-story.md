# Partner Authentication — User Story (Salon Owner & Staff)
**Date:** 2025-09-01  
**Status:** Draft v2 (Owner recommended 2FA; Staff optional/policy‑driven)

## 1) Story
As a **Salon Owner/Staff**, I need secure but convenient login and visibility over sessions so operations are safe and uninterrupted.

## 2) Assumptions
- Partner app hosted at `partner.cthub.in` (configurable).  
- **Owner**: recommended 2FA (enforced by policy option).  
- **Staff**: optional 2FA unless tenant policy mandates it.

## 3) Scenarios & Acceptance Criteria (Gherkin)
### P‑1 Owner prompted to enable 2FA
**Given** an Owner without 2FA  
**When** they sign in  
**Then** a non‑dismissable banner requests **Passkey/TOTP** enrollment until completed.

### P‑2 Staff invitation & activation
**Given** an Owner invites a Staff member  
**When** the Staff opens the single‑use invitation (short TTL)  
**Then** they set a password, optionally enroll 2FA, and are signed in  
**And** invitation cannot be reused.

### P‑3 Device oversight & revocation
**Given** an Owner views **Active Sessions**  
**Then** the Owner can revoke **their own** sessions and **any Staff** sessions in their tenant  
**And** revoked sessions are logged and tokens invalidated.

### P‑4 Limited SSO preview of Customer app (read‑only)
**Given** Staff with preview permission  
**When** they open the Customer app via “Preview”  
**Then** they see read‑only UI with no mutation actions.

### P‑5 Password reset (flexible)
**Given** Staff forgot password  
**When** they use the reset link  
**And** 2FA is unavailable  
**Then** they can use **recovery code** to complete reset; otherwise manual verification per tenant policy.

## 4) Error Handling
- Standardized, localized messages; no existence leak for invites/resets.  
- After password change/reset, **log out other sessions**.

## 5) UX
- Entry: `/login`; clear prompts for 2FA where applicable.  
- Post‑login: Owner → `/dashboard`; Staff → `/schedule`.

## 6) Tests
- Unit: invite lifecycle, policy enforcement, device revoke.  
- E2E: Owner 2FA prompt, Staff invite acceptance, cross‑app preview.  
- Perf: p95 sign-in < 900ms.
