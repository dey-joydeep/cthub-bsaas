# DB Alterations — Registration & Verification

**Date:** 2025-09-07

## Summary

Add minimal fields/models to support Customer OTP-first, Partner MFA gating + reminders, and unified verification challenges.

## Prisma Additions

### 1) User (fields)

```prisma
model User {
  // existing...
  isVerified            Boolean   @default(false) @map("is_verified")
  emailVerifiedAt       DateTime?                  @map("email_verified_at")
  isMFAEnrollRequired   Boolean   @default(false) @map("is_mfa_enroll_required")
  mfaReminderFirstAt    DateTime?                  @map("mfa_reminder_first_at")
  mfaReminderLastAt     DateTime?                  @map("mfa_reminder_last_at")
}
```

### 2) New models

```prisma
model RegistrationLink {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tokenHash  String   @unique @map("token_hash")
  email      String
  salonId    String   @map("salon_id") @db.Uuid
  issuedAt   DateTime @default(now()) @map("issued_at")
  expiresAt  DateTime @map("expires_at")
  usedAt     DateTime? @map("used_at")
  invitedBy  String?  @map("invited_by") @db.Uuid
  salon      Salon    @relation(fields: [salonId], references: [id], onDelete: Cascade)
  @@index([email])
  @@index([salonId])
  @@index([expiresAt])
  @@map("registration_link")
}

model StaffInvite {
  id               String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tokenHash        String    @unique @map("token_hash")
  email            String
  salonId          String    @map("salon_id") @db.Uuid
  role             String
  tempPasswordHash String    @map("temp_password_hash")
  issuedAt         DateTime  @default(now()) @map("issued_at")
  expiresAt        DateTime  @map("expires_at")
  usedAt           DateTime? @map("used_at")
  invitedBy        String?   @map("invited_by") @db.Uuid
  salon            Salon     @relation(fields: [salonId], references: [id], onDelete: Cascade)
  @@index([email])
  @@index([salonId])
  @@index([expiresAt])
  @@map("staff_invite")
}
```

### 3) Extend EmailVerification

```prisma
enum VerificationPurpose { registration, email_change, password_reset, mfa_change, mfa_add, social_link }

model EmailVerification {
  // existing...
  purpose    VerificationPurpose @default(registration)
  sessionId  String?
  meta       Json?
  // keep attempts (counter), codeHash, expiresAt, usedAt, email
  @@index([email, purpose, expiresAt])
  @@index([sessionId, purpose])
}
```

## Migration Plan

1. **Additive migration**: add fields/models; no destructive changes.
2. **Deploy code** that reads/writes new fields. If an old flag exists (`mustEnrollMFA`), write both during one release.
3. **Cleanup**: remove obsolete flag after verifying no reads.

## Rollback

Drop newly added columns/models only; avoid renames without two-phase rollout.

## Post-deploy Validation

- Create RegistrationLink/StaffInvite; verify indexes.
- OTP flows with `purpose` work for all endpoints.
- Scheduler finds due Partner users and updates `mfaReminderLastAt`.
