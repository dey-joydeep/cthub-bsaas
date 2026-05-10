# Auth Telemetry Events
**Updated:** 2025-09-11

## Provider & Adapter
- Frontend `TelemetryService` with adapters for **PostHog** (default), **GA4**, **Segment**.
- Switch via environment tokens; single call site in service; no PII by default.

## Privacy & Governance
- No raw emails/usernames; use `user_id` and optional `email_domain`. Hash if needed (salted SHA‑256).
- Success events sampled (default 20%); error events 100%.
- Respect consent flags. Default retention 13 months.
- Carry `correlationId` across FE→BE to stitch traces.

## Event Catalog

- `auth.login_started|failed|succeeded` { method, mfa_required?, error_code? }
- `auth.mfa_prompted|completed|failed` { factor, error_code? }
- `auth.password_reset_requested|completed` { token_age_ms? }
- `auth.recovery_issued|used` { count }
- `auth.devices_revoked` { count }
- `auth.social_linked|unlinked` { provider, email_verified }
- `auth.passkey_enrolled|removed|set_default` { platform: 'platform|roaming' }
- `auth.email_change_requested|confirmed` { old_domain, new_domain }
- `auth.password_changed` { strength, had_breach_hint?: boolean }


## Implementation Notes
- Strongly type event payloads in TS.
- Log rate‑limited/blocked actions at WARN with code and cooldown.
