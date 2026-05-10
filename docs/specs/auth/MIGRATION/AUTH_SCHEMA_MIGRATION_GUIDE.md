# Auth Schema — Implementation & Migration Guide
**Date:** 2025-09-01 | **DB:** PostgreSQL | **Prisma:** 6.x

## Overview
Implements single **User** with tenant memberships & roles, **cookie AT/RT rotation**, **sessions**, **passkeys/TOTP**, **recovery codes**, **email verification**, **password reset**, **social accounts**, and optional **DB audit events**.

## Files
- Prisma: `libs/server/data-access/prisma/schema.prisma`
- Adapters: `libs/server/data-access/src/adapters/*`
- Auth feature: `libs/server/features/auth/src/lib/*`

## Migration (Phased)
### Phase 1 — Additive
1. Replace/merge schema with the provided one.
2. Run:
   ```bash
   npx prisma migrate dev --name auth_consolidation_v1
   npx prisma generate
   ```

### Phase 2 — Backfill & Switch
- Backfill email verification timestamp if you had a boolean flag:
  ```sql
  UPDATE "user" SET email_verified_at = NOW()
  WHERE email_verified_at IS NULL /* AND is_verified = TRUE */;
  ```
- Start writing to **EmailVerification** (hash OTP) & **PasswordReset** (hash token).
- On login create **Session**, issue **RefreshToken (jti)**; on refresh, **rotate** and **revoke** prior jti.

### Phase 3 — 2FA & Recovery
- Add WebAuthn & TOTP enrollment; store secrets encrypted (AES‑GCM).  
- Generate **recovery codes** (hashed).  
- Implement **flexible reset**: if 2FA unavailable, accept recovery code.

### Phase 4 — Cleanup
- Remove legacy OTP usage and deprecated flags.
- Finalize:
  ```bash
  npx prisma migrate dev --name auth_consolidation_cleanup
  ```

## Security Notes
- **RT rotation:** bind RT to `Session`; reuse of old jti ⇒ revoke & audit.
- **TOTP secret:** encrypt to `Bytes`; store `secretVersion`; rotate keys as needed.
- **Hash all codes/tokens** before persisting; compare constant-time.
- **No PII**: use `ipHash` instead of raw IP.

## Seed
```sql
INSERT INTO role (id, key, scope, created_at, updated_at) VALUES
  (gen_random_uuid(), 'PLATFORM_ADMIN', 'PLATFORM', NOW(), NOW()),
  (gen_random_uuid(), 'OWNER', 'TENANT', NOW(), NOW()),
  (gen_random_uuid(), 'STAFF', 'TENANT', NOW(), NOW()),
  (gen_random_uuid(), 'CUSTOMER', 'TENANT', NOW(), NOW())
ON CONFLICT (key) DO NOTHING;
```
> If `gen_random_uuid()` is unavailable, rely on Prisma defaults.

## Indexes & Retention
- See schema `@@index`/`@@unique`. Purge expired verification/reset rows; prune stale sessions/RTs.

## Testing
- Unit: login, refresh, enroll passkey, verify TOTP, reset, recovery, email verify.
- E2E: admin first-login 2FA; step-up; partner invite; customer booking-first; RT replay blocked.
- Perf: p95 login < 900ms; refresh < 200ms.
