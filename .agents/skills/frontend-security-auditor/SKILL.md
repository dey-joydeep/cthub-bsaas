---
name: frontend-security-auditor
description: >-
  Executes an exhaustive, multi-layer frontend security audit and verification
  loop across Angular (v22+), TypeScript, HTML templates, and web routing slices.
  Covers DOM-based XSS, Angular DomSanitizer bypasses, client-side token storage,
  route guard enforcement, CSRF interceptors, CSP headers, open redirects, SSR
  secret leakage, and contextual npm package CVE analysis with persistent ledger tracking.
---

# Frontend Security Auditor

This skill coordinates and executes end-to-end client-side security audits, threat
modeling, and closed-loop remediations for Angular frontend slices (`libs/web/**`
and `apps/web/**`). It inspects the full client pipeline—from route guards and
template data bindings down to HTTP client interceptors, browser storage, and SSR
hydration boundaries.

## Trigger Conditions

Use this skill when:

- The user requests a security review, vulnerability check, or penetration audit
  on any frontend module, component, guard, interceptor, or template (e.g. "audit
  frontend security on salon-owner UI", "check for XSS or token leaks", "verify client security").
- A new or modified frontend feature slice is completed and needs pre-PR verification.
- Post-remediation verification is required to confirm that client-side security
  findings are verifiably closed without introducing visual, behavioral, or hydration regressions.

---

## 1. Pre-Flight Model & Reasoning Effort

Frontend security audits require cross-template taint tracking (tracking untrusted
data from API responses or URL query parameters into Angular template interpolation,
DOM properties, and browser storage).

1. **Check Live Model Quota & Availability**:
   - Query available models and remaining quotas using the `swarm` action `models`.
   - Prefer models equipped with **`high`** or **`xhigh`** reasoning effort
     (e.g., `claude-opus-5-5-high`, `gemini-4-argon-high`, `claude-sonnet-5-5-high`).
2. **Subagent Invocation Tier**:
   - When invoking a security subagent via `invoke_subagent`, set `Model: 'pro'`
     (or inherit an active Pro/High-effort session).
   - If the Pro tier is quota-exhausted ($< 15\%$), fallback to `inherit` with
     Gemini 3.8 Flash (per repository AIDD policy) and log the tier switch.
3. **AIDD Governance Rule**:
   - The Antigravity subagent performs interactive, developer-level audits and
     remediations. Formal final release sign-offs and dual-independent reviews
     remain assigned to Codex per `docs/aidd/README.md`.

---

## 2. Scope Determination & Persistent Audit Ledger

The audit workflow maintains an incremental state ledger at
`.agents/state/frontend-security-ledger.json` to prevent duplicate audits on
unmodified components while ensuring newly created or touched files are scrutinized.

1. **Inspect Ledger State**:
   Run the frontend ledger runner script:
   ```powershell
   pwsh -Command "node scripts/aidd/frontend-security-audit.mjs --module <module-name>"
   ```
2. **Incremental Scope Detection**:
   - Compares current file SHA-256 hashes against `lastAuditedHash` in the ledger.
   - Detects all newly created, modified, or staged files (`.ts`, `.html`, `.scss`).
   - If a file is unmodified since its last verified clean audit, it is skipped.
3. **Mid-Work Baseline Initialization**:
   - If introduced in the middle of ongoing work without a prior record, the tool
     establishes a fresh baseline for the touched frontend module.

---

## 3. Comprehensive Frontend Vulnerability Taxonomy

The auditor inspects code against enterprise CWE and OWASP Client-Side Web failure modes:

| Category                                  | CWE Identifiers   | Inspection Invariants & Code Paths                                                                                                                                                                                                                                                                                                                                |
| :---------------------------------------- | :---------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **DOM-based XSS & Sanitizer Bypasses**    | CWE-79, CWE-116   | Inspect all uses of `DomSanitizer`: `bypassSecurityTrustHtml`, `bypassSecurityTrustScript`, `bypassSecurityTrustStyle`, `bypassSecurityTrustUrl`, and `bypassSecurityTrustResourceUrl`. Ensure untrusted user data is never wrapped in trust bypasses. Prohibit unescaped `[innerHTML]`, `ElementRef.nativeElement.innerHTML`, or direct `document.write`/`eval`. |
| **Sensitive Token & Storage Exposure**    | CWE-312, CWE-922  | Forbid storing raw JWT access tokens, refresh tokens, or passwords in unencrypted `localStorage` (vulnerable to XSS extraction). Verify use of `httpOnly`, `Secure`, `SameSite=Lax/Strict` cookies or transient memory storage (Signals/Services).                                                                                                                |
| **Route Guard & Client Boundary Bypass**  | CWE-285, CWE-862  | Protected routes (`/admin/**`, `/owner/**`, `/partner/**`) MUST be bounded by functional guards (`canActivate: [authGuard, roleGuard]`, `canMatch`). Lazy-loaded chunks must not be exposed to unauthenticated roles. Verify that role checks reflect backend RBAC.                                                                                               |
| **CSRF / XSRF & Interceptor Hardening**   | CWE-352           | Mutating HTTP calls (`POST`, `PUT`, `DELETE`, `PATCH`) must transmit anti-CSRF headers (e.g. `X-XSRF-TOKEN`). Verify Angular's `withXsrfConfiguration` or custom `HttpInterceptorFn`. Idempotent `GET`/`HEAD` requests must never perform server state changes.                                                                                                   |
| **Content Security Policy & SRI**         | CWE-1021, CWE-353 | Check `index.html` headers/meta tags for strict CSP: disallowing `'unsafe-inline'` and `'unsafe-eval'`. External scripts (CDNs, analytics, SDKs) MUST enforce Subresource Integrity (`integrity="sha384-..."`) and `crossorigin="anonymous"`.                                                                                                                     |
| **Open Redirects & Insecure Navigation**  | CWE-601           | Query parameter redirect handlers (`returnUrl`, `redirect_uri`) MUST validate target URLs against a relative path pattern (`/^[a-zA-Z0-9_\-\/]+$/`) or trusted origin whitelist. Prohibit passing untrusted URLs directly to `Router.navigateByUrl` or `window.location.href`.                                                                                    |
| **PII & Credential Leakage in URLs/Logs** | CWE-200, CWE-532  | Sensitive fields (passwords, tokens, bank details, residential addresses) MUST NOT be passed as URL query parameters (which leak into browser history, proxies, and `Referer` headers). Strip `console.log` statements dumping full API responses in production bundles.                                                                                          |
| **Clickjacking & UI Redressing**          | CWE-1021          | Ensure application frames are protected with `X-Frame-Options: DENY` or CSP `frame-ancestors 'none'`. If `<iframe sandbox>` is used, restrict sandbox capabilities to minimum required permissions.                                                                                                                                                               |
| **Cross-Window Messaging & PostMessage**  | CWE-345           | Any `window.addEventListener('message', ...)` handler MUST strictly validate `event.origin === expectedOrigin` before processing `event.data`. Never use wildcard `*` target origins when posting sensitive credentials.                                                                                                                                          |
| **SSR Secret Leakage & Hydration**        | CWE-200, CWE-668  | In Angular SSR (Analog/Vite/Node), verify server-only secrets or private environment variables are never serialized into `TransferState` or bundled into client script assets. Ensure DOM APIs (`window`, `document`, `localStorage`) are guarded with `isPlatformBrowser`.                                                                                       |

---

## 4. Contextual Client Dependency & Supply Chain Scan

1. **Client Manifest & Lockfile Scan**:
   - Executes `npm audit --json` and isolates dependencies imported by frontend applications (`libs/web/**`, `apps/web/**`).
2. **Contextual Reachability Analysis (Anti-False-Positive)**:
   - Evaluates whether vulnerable libraries or transitive packages are actually bundled into client distributions.
   - Build-time only tools (compilers, linters) that do not leak into the browser bundle are triaged and documented as build-time only.
3. **Repository Dependency Policy Compliance**:
   - Strictly enforces `docs/aidd/dependency-policy.md`:
     - Disallows `--legacy-peer-deps` and `--force`.
     - Validates SHA-512 integrity hashes and approved HTTPS registry origins.

---

## 5. False Positive Triage (Preventing Blind Edits)

Autonomous remediation MUST NOT proceed on unverified alerts. Before modifying any frontend source file, apply the 2-tier verification filter:

1. **Tier 1 (Subagent Proof of Risk)**:
   The auditor subagent must supply a concrete **Proof of Exploitability**:
   - Exact component, template line number, or script binding.
   - Attack vector (e.g. payload in input query param or API response reaching unescaped sink).
   - Demonstrated failure of sanitization or guard bypass.
2. **Tier 2 (Framework Invariant Verification)**:
   The coordinator tests the hypothesis:
   - _Does Angular's built-in template binding (`{{ ... }}` or `[property]`) automatically HTML-encode the payload?_
   - _Is the data source strictly typed and constrained from reaching external attacker influence?_
   - _Does the backend API already sanitize or reject malicious script payloads?_
3. **Disposition**:
   - If verified: Mark finding as `OPEN` and schedule for remediation.
   - If disproven: Record in the audit ledger as `FALSE_POSITIVE` with clear
     technical justification so future runs do not re-flag it.

---

## 6. Closed-Loop Remediation & Verification Protocol

When remediating verified client-side vulnerabilities:

1. **Targeted Defense-in-Depth**:
   - Implement the minimal, robust fix (e.g., replace `bypassSecurityTrustHtml` with safe Angular template binding or `SecurityContext.HTML` sanitization, add `canActivate` guard, or implement relative URL validation).
2. **Verification Suite Execution**:
   Every remediation must pass all frontend verification gates:
   ```powershell
   # 1. Format compliance
   pwsh -Command "npm run aidd:format:changed -- --worktree"

   # 2. Strict TypeScript type check
   pwsh -Command "npx nx type-check <project-name>"

   # 3. ESLint verification (0 warnings)
   pwsh -Command "npx nx lint <project-name>"

   # 4. Unit Test Suite Execution
   pwsh -Command "npx nx test <project-name>"
   ```
3. **Visual & Behavioral Non-Regression Check**:
   - Ensure the security remediation does not break styling, layout responsiveness,
     form validation states, or SSR hydration.
4. **Update Ledger & Artifact**:
   - Record resolved findings and updated file hashes in
     `.agents/state/frontend-security-ledger.json`.
   - Update or publish the audit artifact in `<appDataDir>\brain\<conversation-id>\`.
