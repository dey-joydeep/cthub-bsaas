# Error Message Catalog

**Date:** 2026-05-18
**Status:** Current cross-cutting baseline

## Purpose

Define how API error codes and frontend message keys are named, grouped, and tested. This keeps backend errors, frontend localization, and test assertions aligned.

## Source Inputs

- [API Conventions](api-conventions.md)
- [Shared HLD Baselines](hld-baselines.md)
- `libs/shared/src/lib/i18n-message-keys/**`

## Code Shape

Error codes must be stable dot-delimited keys:

```text
<domain>.<severity-or-area>.<reason>
```

Examples:

```text
auth.error.invalid_credentials
common.error.forbidden.scope
salon_owner.appointment.error.slot_conflict
salon_owner.pos.validation.payment_amount_exceeds_due
```

## Naming Rules

| Rule ID | Rule                                                                                                     |
| ------- | -------------------------------------------------------------------------------------------------------- |
| MSG-001 | Codes must be stable enough for frontend localization and tests.                                         |
| MSG-002 | Codes must not include dynamic IDs, names, emails, phone numbers, or timestamps.                         |
| MSG-003 | Backend responses must include a fallback `message`, but frontend localization should use `code`.        |
| MSG-004 | Validation errors must include field-level `details` when a specific input is invalid.                   |
| MSG-005 | Security-sensitive errors must not reveal whether a credential, account, or cross-scope resource exists. |
| MSG-006 | New feature domains must add message-key groups under `libs/shared` before implementation.               |

## Domain Prefixes

| Prefix               | Use                                                                |
| -------------------- | ------------------------------------------------------------------ |
| `common.*`           | Shared platform messages and generic errors.                       |
| `auth.*`             | Authentication, sessions, MFA, passkeys, OAuth, account security.  |
| `salon_owner.*`      | Salon owner operational features.                                  |
| `customer_app.*`     | Customer app booking, profile, rewards, and customer-facing flows. |
| `platform_admin.*`   | SaaS administration and support operations.                        |
| `public_discovery.*` | Public search, public salon profiles, and SEO-facing resources.    |
| `notifications.*`    | Messaging, templates, consent, delivery states.                    |
| `integrations.*`     | External provider configuration, webhook, and callback errors.     |
| `reporting.*`        | Analytics, reports, exports, and metric validation.                |
| `privacy.*`          | Consent, data export, deletion, retention, and governance.         |

## Error Detail Shape

Field validation errors should include:

```json
{
  "field": "startAt",
  "code": "salon_owner.appointment.validation.start_at_required",
  "reason": "required"
}
```

Cross-field validation errors should include:

```json
{
  "field": null,
  "code": "salon_owner.appointment.validation.end_after_start",
  "reason": "crossField"
}
```

## Test Requirements

Each feature test pack must verify:

- known validation failures return the documented key;
- permission failures use `common.error.forbidden.*`;
- conflict failures use feature-specific conflict keys;
- message keys are exported from shared message-key files when intended for frontend use;
- sensitive errors do not leak private existence checks.
