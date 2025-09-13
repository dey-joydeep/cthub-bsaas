# Auth Backend — Plan & Progress (Audit + Partner Registration)

Scope
1. Repo: `libs/server/features/auth`
2. Specs reviewed: `docs/specs/auth/API`, `docs/specs/auth/FLOWS`, `docs/specs/auth/MIGRATION`
3. DB alterations/migrations for Partner Registration are included as a dedicated subtask (see section G). Other schema work remains tracked separately.
4. Goal: Capture non‑registration gaps and a concrete plan for Partner (Owner/Staff) registration.

## Non‑Registration Gaps (from Specs vs Implementation + Internal Plans)

1. [ ] Success/Error envelope normalization (API HLD §2)
   - Current controllers return raw payloads (e.g., `{}`) without the canonical `{ success, data }` wrapper.
   - Action: Add a response‑normalizing interceptor (likely in `server-core`) and apply in Auth module; keep controller returns minimal `data` only.

2. [ ] CSRF enforcement on Refresh (LLD §2.E)
   - Spec: Refresh requires valid RT cookie + double‑submit XSRF header.
   - Current: `POST /auth/refresh` is marked `@SkipCsrf()` and does not require the header.
   - Action: Remove `@SkipCsrf()` from refresh; ensure CsrfGuard enforces header when `XSRF-TOKEN` cookie is set; update IT accordingly.

3. [ ] Retry‑After header on 429 (HLD §7; LLD §2)
   - Spec: All rate‑limited responses must include `Retry-After`.
   - Current: We use `@Throttle`, but do not assert/guarantee the header.
   - Action: Verify Nest Throttler integration and ensure `Retry-After` is set; if not, add a filter/interceptor to inject it. Add IT that asserts the header.

4. [ ] Route alias alignment with spec (HLD/LLD)
   1. Recovery Codes
      - Spec: `POST /auth/recovery-codes/issue` (201), `POST /auth/recovery-codes/verify`.
      - Current: `POST /auth/recovery/generate`, `POST /auth/recovery/verify` (200).
      - Action: Add alias routes per spec; return 201 for issue; keep legacy paths for backward compatibility.
   2. Devices/Sessions
      - Spec: `GET /auth/devices`, `POST /auth/devices/revoke`.
      - Current: `GET /auth/sessions`, `POST /auth/sessions/revoke` and `POST /auth/sessions/revoke/:id`.
      - Action: Add alias endpoints that proxy to existing methods.
   3. OAuth Unlink
      - Spec: `DELETE /auth/oauth/{provider}`.
      - Current: `POST /auth/oauth/:provider/unlink`.
      - Action: Add `DELETE` alias and keep existing `POST`.

5. [ ] Email Change feature (LLD §2.F)
   - Spec: `POST /auth/email/change/request` (202), `POST /auth/email/change/confirm`.
   - Current: Not implemented.
   - Action: Add DTOs, controller actions, and service methods (server‑side validation + throttling). No DB migration work here; wire via ports where necessary.

6. [ ] Password Change feature (LLD §2)
   - Spec: `POST /auth/password/change` with `{ currentPassword, newPassword }`.
   - Current: Not implemented.
   - Action: Add DTO, controller action, service method; verify current password; rotate sessions if policy requires; rate‑limit attempts.

7. [ ] CorrelationId propagation (HLD §3, §7)
   - Spec references `correlationId` in errors/telemetry.
   - Current: Audit events omit correlationId; responses are not normalized.
   - Action: Add correlationId injection (e.g., middleware) and include it in AuditService logs and the normalized response envelope.

8. [ ] Contract validation against OpenAPI (CI)
   - Spec: Controllers validated against `openapi.yaml`.
   - Current: Not wired.
   - Action: Add contract tests (or CI job) to assert route/shape parity for key endpoints.

9. [ ] Server architecture hardening (applies to auth; see checklist)
   - [ ] Add CI job for backend coverage (`nx run-many -t test -p server-feature-* --code-coverage`)
   - [ ] Add no-restricted-imports rule to discourage deep relative imports to core (optional hardening)
   - [x] Coverage thresholds already enforced for `server-feature-auth`

10. [ ] REST ergonomics improvements (from audit)
   - [ ] Add alias `DELETE /auth/sessions/:id` (idempotent) in addition to existing POST revoke
   - [ ] Consider `204 No Content` for actions returning no body (logout, verify endpoints); else keep `200` with minimal body
   - [ ] Ensure all non-resource-creating POSTs have explicit `@HttpCode(200)` (TOTP/WebAuthn/Recovery)

11. [ ] OpenAPI alignment work
   - [ ] Update `openapi.yaml` to include canonical + alias paths during migration and reflect cookie names
   - [ ] Add CI contract validation step

## Partner Registration (Owner & Staff) — Plan & Progress

Legend: [ ] pending, [x] done, [~] in progress

### A. Endpoints & DTOs (HTTP; Customer remains unchanged)
1. [x] GET `/auth/owner/registration/{token}` — validate invite token
2. [x] POST `/auth/owner/registration/complete` — complete Owner registration
3. [x] GET `/auth/staff/registration/{token}` — validate invite token
4. [x] POST `/auth/staff/registration/complete` — complete Staff registration
5. [x] DTOs: `OwnerInviteValidateDto` (param token), `OwnerRegistrationCompleteDto`, `StaffInviteValidateDto`, `StaffRegistrationCompleteDto`
6. [x] Rate limiting on complete endpoints (per spec; include `Retry-After`)

Notes
1. Return envelope `{ success, data }` once normalization is added; until then return minimal bodies.
2. Use 410 for expired/consumed tokens; 400 for malformed; 422 for weak passwords/invalid inputs.

### B. Service Layer & Ports (no DB changes here)
1. [x] Ports added under `server-contracts-auth` (no persistence impl here):
   - `INVITE_PORT` with methods: `validateOwner(token)`, `completeOwner({ token, password, twoFactor? })`, and the staff equivalents.
2. [x] `AuthService` partner methods:
   - `validateOwnerInvite(token)`, `completeOwnerRegistration(dto)`
   - `validateStaffInvite(token)`, `completeStaffRegistration(dto)`
3. [x] 2FA path (optional at complete): Accept optional TOTP code/enrollment handoff; keep API additive.
4. [x] Issue session+cookies on successful complete, or return `next: mfa` if 2FA required.

### C. Guards, CSRF, Cookies
1. [x] Apply CsrfGuard policy where appropriate (complete endpoints likely `@SkipCsrf()` if no cookies yet; validate invite via GET safe method).
2. [x] On success: set `bsaas_at`, `bsaas_rt`, rotate `XSRF-TOKEN` using `AuthCookiesService`.

### G. DB Alterations (Partner Registration)
1. [x] Update Prisma schema per:
   - docs/specs/auth/MIGRATION/db-alterations-registration.md
   - docs/specs/auth/MIGRATION/registration-db-changes.md
   Consolidate overlapping guidance as follows (Prisma models may map to snake_case via @@map):
   - User: add `isVerified`, `emailVerifiedAt`, `isMFAEnrollRequired`, `mfaReminderFirstAt`, `mfaReminderLastAt`, and `registrationStatus` enum (`pending` | `verified` | `completed`).
   - RegistrationSession: ephemeral model with `id`, `email`, `state` (Json), `expiresAt`, timestamps; @@index on `email`; add retention job note.
   - PartnerInvite: model for partner invites with `tokenHash` (or `token` per spec), `role` (`owner`|`staff`), `email`, `expiresAt`, `consumedAt/usedAt`, `createdBy/invitedBy`, `salonId` relation; @@unique on token, indexes on `email`, `expiresAt`.
   - RegistrationLink (Owner flow): if kept separate from PartnerInvite, ensure clear purpose and deduplicate with PartnerInvite where possible.
   - Verification: prefer a single `EmailVerification`/`VerificationToken` model with `purpose` enum (include `email_verify`, `invite`, and existing purposes), plus `sessionId`, `meta`; add indexes on `(email, purpose, expiresAt)` and `(sessionId, purpose)`.
   - Enforce email CI-uniqueness at DB or application level; document in schema/comments.
2. [x] Generate migration: `npx prisma migrate dev --name partner_registration_additions`
3. [x] Regenerate client: `npx prisma generate`
4. [x] Reset test DB with migration history: `npx prisma migrate reset --force --skip-seed` (bsaas_test)
4. [x] Add lightweight IT to validate new tables/columns exist (Prisma can query, indexes present; one active registration session per email enforced in code).
5. [x] Update seed/backfill plan if needed (see AUTH_SCHEMA_MIGRATION_GUIDE.md Phase 2) — N/A for new feature.

### D. Tests (UT/IT; 100% coverage targets)
1. [x] UT: controller DTO validation, service method branches (expired, consumed, invalid, success)
2. [x] IT: happy path and error branches for Owner/Staff validate and complete
3. [x] Edge cases: rate limit `Retry-After`, malformed tokens (400), expired (410), already used (410), weak passwords (400)

### E. Observability & Audit
1. [x] Audit events: `owner_invite_validate`, `owner_registration_complete`, `staff_invite_validate`, `staff_registration_complete` (include correlationId)

### F. Backward/Forward Compatibility
1. [x] Keep Customer flow untouched; route names unchanged
2. [x] Partner flows strictly under the new endpoints (no overlap)

## Execution Plan (Incremental)

1. Response envelope + Retry‑After
   1. [x] Add response normalization interceptor (success) in `server-core`; apply in AuthController
   2. [x] Ensure `Retry-After` header is present for throttled endpoints (core filter added)
   3. [x] Update IT to validate envelope + headers

2. CSRF on refresh
   1. [x] Remove `@SkipCsrf()` on refresh; rely on `CsrfGuard`
   2. [x] Update IT to require `X-XSRF-TOKEN` where cookie exists
   3. [x] Verified UT/IT 100% coverage and lint clean

3. Route aliases (non‑breaking)
   1. [x] Add alias routes for recovery codes (201 issue), devices (list/revoke), OAuth unlink (DELETE)
   2. [x] Update IT to assert both legacy and new aliases work
   3. [x] Update OpenAPI to include canonical + alias paths (temporary during migration)
   4. [x] Add alias `DELETE /auth/sessions/:id` (idempotent revoke)

4. Email change + Password change
   1. [x] Implement Password Change (controller/service/DTO + rate limit)
   2. [x] Add UT/IT with 100% coverage for Password Change
   3. [x] Implement Email Change (request/confirm + rate limit)
   4. [x] Add UT/IT with 100% coverage for Email Change

5. CorrelationId in audit + responses
   1. [ ] Add middleware to assign `correlationId`; include in AuditService logs
   2. [ ] Ensure error envelope includes `correlationId`

6. Controller decoupling from Express (from decoupling plan)
   1. [x] Use `AuthCookiesService` + `CookiesInterceptor`; no `@Res` usage in controllers
   2. [x] Apply `@UseInterceptors(CookiesInterceptor)` to controllers that set cookies (AuthController)
   3. [ ] Add portability note to HLD/LKD (done for HLD; verify LLD mentions interceptor)
   4. [ ] Ensure IT harness registers interceptor when needed (double‑check other features if applicable)

7. CI and lint hardening (from hardening checklist)
   1. [ ] Add CI job to enforce per‑project coverage thresholds across server features
   2. [ ] Add no‑restricted‑imports for core deep paths (optional)
   3. [ ] Add quick grep in CI to ensure no guard classes in feature libs (`class .*Guard`)

6. Partner Registration (Owner/Staff)
   1. [x] Add ports (interfaces only) and wire providers in Auth module for tests
   2. [x] Implement validate/complete controller + service flows (no DB changes)
   3. [x] Add UT/IT; ensure cookies + CSRF policy and rate limits

## Current Status Snapshot

1. UT: 100% coverage ✔
2. IT: 100% coverage ✔
3. Cookies/XSRF: Implemented; refresh CSRF policy aligned ✔
4. OAuth: start/callback/link/unlink present; DELETE alias added ✔
5. Recovery Codes: generate/verify present; canonical alias added (issue/verify) ✔
6. Devices/Sessions: list/revoke present; canonical alias added (devices list/revoke) ✔
7. Email change: missing ❗
8. Password change: missing ❗
9. Envelope normalization: missing ❗
10. Retry‑After header: verify/add ❗
11. CorrelationId: not propagated ❗
12. Controller decoupling: cookies via interceptor; Express‑coupling removed ✔
13. CI coverage & lint hardening: pending ❗
14. OpenAPI update & contract tests: pending ❗
15. Partner Registration (Owner/Staff): pending ❗

> Items marked ❗ are recommended for near‑term implementation.

## Context for Next Session Continuation

1. Branch and commits
   - Current branch: `feat/auth-backend-foundation`
   - Recent commits (most recent first):
     - feat(server-feature-auth): add spec-aligned alias routes and tests — d354a6d9f
     - docs(server-feature-auth): clarify Customer-only registration — e6c8a7309
     - test(server-feature-auth): reach 100% UT/IT and fix lint — 991f9345e

2. Primary working doc
   - Plan/status: `./tmp/auth-backend-plan-and-progress-status.md` (this file)
   - Updated specs for parity:
     - HLD: `docs/specs/auth/API/api-hld.md` (section 11)
     - LLD: `docs/specs/auth/API/api-lld.md` (route aliases + cookie names)

3. Validation commands
   - UT: `npx nx test server-feature-auth --configuration=ut`
   - IT: `npx nx test server-feature-auth --configuration=it`
   - Lint: `npx nx lint server-feature-auth`

4. Immediate next steps (pick up here)
   - Execute Execution Plan items in this order:
     1) Route aliases: add IT assertions and update OpenAPI — Exec 3.2, 3.3
     2) Response envelope normalization + Retry-After headers — Exec 1
     3) Email change + Password change endpoints — Exec 4
     5) CorrelationId middleware/logging and error envelope — Exec 5
     6) Partner registration endpoints (Owner/Staff) — Exec 6

5. Notes
   - DB alterations for Partner Registration are in scope (see section G); other unrelated schema changes remain separate.
   - All current tests/lint are green at 100% coverage after alias additions.
