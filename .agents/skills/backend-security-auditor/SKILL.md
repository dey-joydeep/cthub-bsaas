---
name: backend-security-auditor
description: >-
  Executes an exhaustive, multi-layer backend security audit and verification
  loop across NestJS, PostgreSQL, and Prisma vertical slices. Covers enterprise
  CWE matrices, multi-tenant BOLA/IDOR isolation, TOCTOU concurrency race
  conditions, contextual CVE reachability, and automated false-positive triage
  with persistent ledger tracking.
---

# Backend Security Auditor

This skill coordinates and executes end-to-end security audits, threat modeling,
and closed-loop remediations for backend vertical slices. It operates across the
entire backend pipeline—from HTTP entry gateways down to PostgreSQL transaction
boundaries and database query builders.

## Trigger Conditions

Use this skill when:

- The user requests a security review, vulnerability check, or penetration audit
  on any backend module, controller, service, or migration (e.g. "audit backend
  security on staff module", "check for vulnerabilities", "run security review").
- A new or modified backend slice (`libs/server/**`, `apps/api/**`, or
  `libs/server/data-access/prisma/schema.prisma`) is completed and needs
  pre-PR verification.
- Post-remediation verification is required to confirm that security findings
  are verifiably closed without introducing regressions.

---

## 1. Pre-Flight Model & Effort Selection

Security audits require deep non-linear taint analysis, symbolic data flow
tracking, and concurrency state simulation. Shallow models produce false alarms
or miss multi-file data leaks.

1. **Check Live Model Quota & Availability**:
   - Query available models and remaining quotas using the `swarm` action `models`.
   - Prefer models equipped with **`high`** or **`xhigh`** reasoning effort
     (e.g., `gemini-4-argon-high`, `claude-opus-5-5-high`, `claude-sonnet-5-5-high`).
2. **Subagent Invocation Tier**:
   - When invoking the `security-engineer` subagent via `invoke_subagent`, set
     `Model: 'pro'` (or inherit an active Pro/High-effort session).
   - If the Pro tier is quota-exhausted ($< 15\%$), fallback to `inherit` with
     Gemini 3.8 Flash (per repository AIDD policy) and log the tier switch.
3. **AIDD Governance Rule**:
   - The Antigravity subagent performs interactive, developer-level audits and
     remediations. Formal final release sign-offs and dual-independent reviews
     remain assigned to Codex per `docs/aidd/README.md`.

---

## 2. Scope Determination & Persistent Audit Ledger

The audit workflow maintains an incremental state ledger at
`.agents/state/backend-security-ledger.json` to prevent duplicate audits on
unmodified code while ensuring newly created or touched files are scrutinized.

1. **Inspect Ledger State**:
   Run the ledger runner script:
   ```powershell
   pwsh -Command "npm run aidd:security-audit -- --module <module-name>"
   ```
2. **Incremental Scope Detection**:
   - Compares current file SHA-256 hashes against `lastAuditedHash` in the ledger.
   - Detects all newly created, modified, or staged files within the target slice.
   - If a file is unmodified since its last verified clean audit, it is skipped.
3. **Mid-Work Baseline Initialization**:
   - If introduced in the middle of ongoing work without a prior record, the tool
     establishes a fresh baseline for the touched module.

---

## 3. Comprehensive Vulnerability Taxonomy

The auditor inspects code against enterprise CWE and OWASP API failure modes:

| Category                                       | CWE Identifiers  | Inspection Invariants & Code Paths                                                                                                                                                                                                                    |
| :--------------------------------------------- | :--------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **BOLA / IDOR & Multi-Tenant Bleed**           | CWE-639, CWE-284 | Every Prisma query MUST enforce `{ business: { tenantId } }` or multi-tenant scope. Parameter tampering across URL params (`:businessId`, `:branchId`, `:staffId`, `:customerId`) must be blocked. Prohibit unverified email-based identity matching. |
| **Function Level Auth & Privilege Escalation** | CWE-285, CWE-862 | Controllers MUST enforce explicit `@Roles(...)` decorators. Route handlers must never default to open. Verify that low-privileged roles cannot assign themselves elevated roles or modify system default roles (`isSystemDefault: true`).             |
| **SQL & ORM Query Injection**                  | CWE-89, CWE-943  | Forbid raw string concatenation in Prisma `$queryRawUnsafe` or `$executeRawUnsafe`. Ensure parameterized tagged templates (`$queryRaw`, `$executeRaw`) are exclusively used.                                                                          |
| **Concurrency & TOCTOU Races**                 | CWE-362, CWE-367 | State invariants (e.g. "last active owner", balance deductions, capacity locks) MUST execute inside `this.prisma.$transaction` using PostgreSQL locks (`pg_advisory_xact_lock(hashtext(id))` or row-level `FOR UPDATE`).                              |
| **Input Sanitization & ReDoS**                 | CWE-20, CWE-1333 | All DTO properties MUST be bounded with `@MaxLength`, `@IsString`, and safe regexes. Inspect `@Matches(...)` for polynomial backtracking / catastrophic ReDoS. Enforce minimum lengths and format validation.                                         |
| **Confidential Data & PII Exposure**           | CWE-359, CWE-200 | Residential addresses, bank accounts, dates of birth, and identity docs MUST be stripped from public/directory listings (`mapStaff`). Avoid logging PII in server logs or error responses.                                                            |
| **Path Traversal & Storage Injection**         | CWE-22, CWE-434  | Uploaded asset storage keys (`fileKey`) must conform to strict regex patterns (`^[a-zA-Z0-9_\-./]{8,256}$`) and explicitly reject path traversal (`..`). MIME types and sizes must be verified on server side.                                        |
| **Cryptographic & Token Flaws**                | CWE-347, CWE-327 | Reject JWT algorithm confusion (`none`), prohibit hardcoded/mock tokens in production endpoints, enforce short-lived expiration on presigned URLs.                                                                                                    |
| **SSRF (Server-Side Request Forgery)**         | CWE-918          | Outgoing backend HTTP requests (webhooks, external assets) must validate target schemes (HTTPS) and reject private/loopback IP blocks (`10.0.0.0/8`, `127.0.0.0/8`, `192.168.0.0/16`, AWS metadata `169.254.169.254`).                                |
| **Timing Attacks & Enumeration**               | CWE-208, CWE-385 | Authentication and credential verification must use constant-time comparisons (`crypto.timingSafeEqual`) to prevent user enumeration via timing discrepancies.                                                                                        |
| **Non-Repudiation & Audit Deficits**           | CWE-778, CWE-117 | Every state mutation MUST emit an `AuditEvent` with `userId`, `tenantId`, action name, and entity ID. Sensitive PII must be redacted from audit payloads.                                                                                             |
| **Constraint & Error Masking**                 | CWE-755, CWE-209 | Database constraint violations (e.g. Prisma `P2002` on duplicate unique values) must be caught and mapped to HTTP 409 `ConflictException`, never exposed as raw HTTP 500 server crashes.                                                              |

---

## 4. Contextual CVE & Supply Chain Reachability

In addition to static source analysis, the skill checks dependencies:

1. **Automated Manifest & Lockfile Scan**:
   - Executes `npm audit --json` and filters findings affecting server dependencies.
   - Inspects direct and transitive packages against GitHub Advisory & OSV databases.
2. **Contextual Reachability Analysis (Anti-False-Positive)**:
   - Evaluates whether vulnerable methods/packages are actually imported or invoked
     by the production server codebase.
   - DevDependency-only or unreachable vulnerabilities are triaged and logged as
     non-exploitable in the context of the audited slice.
3. **Repository Dependency Policy**:
   - Validates compliance with `docs/aidd/dependency-policy.md`:
     - Disallows `--legacy-peer-deps` or `--force`.
     - Validates SHA-512 integrity hashes and approved HTTPS registry sources.
     - Confirms parity between `package.json` and `package-lock.json`.

---

## 5. False Positive Triage (Preventing Blind Edits)

Autonomous remediation MUST NOT proceed on unverified alerts. Before touching
any production file, apply the 2-tier verification filter:

1. **Tier 1 (Subagent Proof of Risk)**:
   The auditor subagent must supply a concrete **Proof of Exploitability**:
   - Exact source file and line number.
   - Attack vector and necessary caller preconditions.
   - Demonstrated failure of invariant or boundary.
2. **Tier 2 (System Invariant Verification)**:
   The coordinator tests the hypothesis:
   - _Is the route already protected by upstream global guards (`JwtAuthGuard`, `RolesGuard`)?_
   - _Does the global `ValidationPipe` (`whitelist: true`, `forbidNonWhitelisted: true`) already strip unauthorized fields?_
   - _Does the database schema (unique index, foreign key cascade, check constraint) already reject the invalid state?_
3. **Disposition**:
   - If verified: Mark finding as `OPEN` and schedule for remediation.
   - If disproven: Record in the audit ledger as `FALSE_POSITIVE` with clear
     technical justification so future runs do not re-flag it.

---

## 6. Closed-Loop Remediation & Verification Protocol

When remediating verified vulnerabilities:

1. **Targeted Defense-in-Depth**:
   - Implement the minimal, robust change (e.g., DTO length bounds, `@Roles`
     override, advisory lock, or tenant query condition).
2. **Verification Suite Execution**:
   Every remediation must pass all 4 verification gates:
   ```powershell
   # 1. Format compliance
   pwsh -Command "npm run aidd:format:changed -- --worktree"

   # 2. Strict TypeScript type check
   pwsh -Command "npx tsc -b libs/server/features/<module>/tsconfig.json --pretty false"

   # 3. OpenAPI contract and endpoint parity
   pwsh -Command "npm run openapi:lint:<module>; npm run openapi:check:<module>"

   # 4. Unit and Integration Test Coverage (100% threshold)
   pwsh -Command "npx nx test server-feature-<module> -c ut"
   ```
3. **Re-Audit Verification**:
   - Re-dispatch the `security-engineer` subagent to confirm every finding is
     verifiably closed and no regressions exist.
4. **Update Ledger & Artifact**:
   - Record resolved findings and updated file hashes in
     `.agents/state/backend-security-ledger.json`.
   - Update or publish the audit artifact in `<appDataDir>\brain\<conversation-id>\`.
