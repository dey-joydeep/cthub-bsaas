---
name: integrated-security-auditor
description: >-
  Orchestrates integrated end-to-end security audits across Frontend and Backend
  boundaries. Analyzes live network payloads for over-the-wire PII over-fetching,
  verifies CORS and cookie credential handshakes, validates CSRF anti-forgery
  lifecycle, and tests client-to-server auth state synchronization across both
  localhost and deployed staging/production environments.
---

# Integrated Security Auditor (FE + BE Seam Verification)

This skill audits the **architectural seams** between Frontend and Backend applications.
While isolated backend audits inspect database/controller code and frontend audits
inspect component/template bindings, the Integrated Security Auditor evaluates the
active communication channel: live network payloads, HTTP headers, authentication
handshakes, and environment security configurations.

---

## Dual-Target Environment Architecture

The audit protocol is designed to execute locally by principle, with complete
parameterized support for deployed staging environments when provisioned:

```
+-----------------------------------------------------------------------------------+
|                        Integrated Security Auditor Architecture                    |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [Target 1: Localhost (Active Default)]    |  [Target 2: Deployed Staging (Wired)] |
|  - Web: http://localhost:4201 or :9876     |  - Web: https://partner.staging.cthub |
|  - API: http://localhost:3001              |  - API: https://api.staging.cthub.com |
|  - Scope: Over-the-wire PII leakages,      |  - Scope: Real TLS 1.3 & HSTS headers,|
|    CORS preflight rejection, client        |    subdomain cookie scope (.cthub),   |
|    XSRF token forwarding, DTO contract     |    Cloudflare/Nginx CSP headers,      |
|    parity, and route guard boundaries.     |    CDN cache poisoning on PII routes. |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

### Environment Switching Configuration

| Environment Variable | Localhost Default       | Staging / Cloud Wiring              | Purpose                         |
| :------------------- | :---------------------- | :---------------------------------- | :------------------------------ |
| `E2E_BASE_URL`       | `http://localhost:4201` | `https://partner.staging.cthub.com` | Target frontend origin          |
| `API_BASE_URL`       | `http://localhost:3001` | `https://api.staging.cthub.com`     | Target backend API origin       |
| `TARGET_ENV`         | `local`                 | `staging`                           | Selects strictness profile      |
| `SKIP_WEBSERVER`     | `false`                 | `true`                              | Skips local dev server spawning |

---

## When to Use

- Before promoting a full vertical slice to PR or pre-release verification.
- When an API endpoint or DTO model changes shape, to ensure no un-rendered sensitive
  fields leak over the wire to client network inspectors.
- When modifying authentication schemes, cookie options, or CORS origin configurations.
- When staging or production infrastructure is provisioned, to verify real TLS,
  CSP headers, and CDN cache behavior.

---

## Non-Negotiable Seam Inspection Matrix

### 1. Over-the-Wire PII & Data Over-Fetching Probe (CWE-200 / CWE-359)

- **The Blind Spot:** Backend serializers return fields (e.g. `residentialAddress`,
  `emergencyContactPhone`, `bankAccountNumber`, `hireDate`) that the UI does not render.
- **Verification Rule:** Intercept and parse live JSON response bodies in transit.
  Flag any general list or directory endpoint (`GET /partner/staff`, `GET /customers`)
  that transmits confidential PII over the wire, even if the frontend template hides it.

### 2. Cookie & Credential Handshake Verification (CWE-614 / CWE-1004)

- **The Blind Spot:** Backend issues session cookies that the client fails to attach,
  or sets flags that break in cross-subdomain architectures.
- **Verification Rule:**
  - Verify `HttpOnly` is present on all session and refresh tokens.
  - In `staging`/`prod`: Verify `Secure` flag and `SameSite=Lax` or `Strict`.
  - In `local`: Verify that client HTTP interceptors include `withCredentials: true`
    on authenticated requests without falling back to raw bearer tokens in `localStorage`.

### 3. Anti-CSRF / XSRF Token Exchange Lifecycle (CWE-352)

- **The Blind Spot:** Cookie-to-header token forwarding fails across proxy or SSR boundaries.
- **Verification Rule:**
  - Verify that the backend emits an anti-forgery token (e.g. `XSRF-TOKEN` cookie).
  - Verify that the client reads the cookie and automatically attaches the
    `X-XSRF-TOKEN` header on mutating requests (`POST`, `PUT`, `DELETE`, `PATCH`).
  - Verify that submitting a mutating request without or with an invalid token
    is actively rejected with HTTP 403 Forbidden.

### 4. CORS & Origin Isolation (CWE-346 / CWE-942)

- **The Blind Spot:** Overly permissive origin reflection (`Access-Control-Allow-Origin: *`
  combined with `Access-Control-Allow-Credentials: true`).
- **Verification Rule:**
  - Issue preflight `OPTIONS` requests from unauthorized origins (e.g. `https://evil-attacker.com`).
  - Verify that unauthorized origins are strictly denied and no `Access-Control-Allow-Origin`
    header reflecting the rogue origin is returned.

### 5. Transport Security & Infrastructure Headers (CWE-693 / CWE-1021)

- **Verification Matrix:**

| Header Name                 | Localhost Rule | Staging / Deployed Rule | Enforced Value                              |
| :-------------------------- | :------------- | :---------------------- | :------------------------------------------ |
| `Strict-Transport-Security` | Skipped (HTTP) | **Mandatory**           | `max-age=31536000; includeSubDomains`       |
| `Content-Security-Policy`   | Recommended    | **Mandatory**           | Disallowing `unsafe-inline` / `unsafe-eval` |
| `X-Content-Type-Options`    | **Mandatory**  | **Mandatory**           | `nosniff`                                   |
| `X-Frame-Options`           | **Mandatory**  | **Mandatory**           | `DENY` or `SAMEORIGIN`                      |
| `Referrer-Policy`           | **Mandatory**  | **Mandatory**           | `strict-origin-when-cross-origin`           |

### 6. Client-to-Server Role Guard Parity (CWE-285)

- **The Blind Spot:** UI hides a button, but direct URL navigation or API replay succeeds.
- **Verification Rule:**
  - Attempt accessing protected UI routes (e.g. `/partner/roles`, `/admin/settings`)
    with lower-privileged credentials (e.g. `STYLIST`).
  - Verify that client route guards redirect to unauthorized feedback AND backend
    endpoints reject replayed requests with HTTP 403 Forbidden.

---

## Execution Commands

### 1. Run Local Seam Audit (Localhost)

```powershell
pwsh -Command "npm run aidd:integrated-security-audit -- --env local"
```

### 2. Run Staging Seam Audit (Ready for Wiring)

```powershell
pwsh -Command "npm run aidd:integrated-security-audit -- --env staging --web-url https://partner.staging.cthub.com --api-url https://api.staging.cthub.com"
```

### 3. Run Unit Tests for the Audit Engine

```powershell
pwsh -Command "npm run aidd:integrated-security-audit:test"
```
