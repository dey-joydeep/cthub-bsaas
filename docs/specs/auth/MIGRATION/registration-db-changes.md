# Registration DB Changes

**Updated:** 2026-05-02

## New/Updated Tables

- **users**: add `isVerified` (boolean, default false), `registrationStatus` (enum: pending, verified, completed).
- **registration_sessions**: ephemeral; fields: `id` (uuid), `email`, `state` (json), `expiresAt` (timestamp), `createdAt`, `updatedAt`; index on (`email`), TTL via job/cleanup.
- **verification_tokens**: `id`, `email`, `code`, `purpose` ('email_verify'|'invite'), `expiresAt`, `consumedAt`; unique (`email`,`purpose`) partial on null `consumedAt`.
- **partner_invites**: `id`, `token`, `role` ('owner'|'staff'), `email`, `expiresAt`, `consumedAt`, `createdBy`.

## Indices

- `users.email` unique (CI); `verification_tokens.email` + `purpose`; `registration_sessions.email`; `partner_invites.token`.

## Constraints

- One active registration session per email (invalidate older on new start).
- Token TTLs: email verify (10m), partner invite (7d default); consumed tokens set `consumedAt` and are not reusable.
- Enforce email case-insensitive uniqueness.

## Data Flows & Consistency

- Completing registration atomically creates user + initial profile in a transaction; on error, rollback and leave session intact (allow retry).
- Resend verification idempotent (regenerate or reuse unexpired token).

## Backfill/Migration Notes

- If existing data is present, initialize `isVerified` based on historical events and default `registrationStatus='completed'` for pre-existing users.
