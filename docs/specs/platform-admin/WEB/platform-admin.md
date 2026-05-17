# Platform Admin Web Specification

**Date:** 2026-05-18
**Status:** Current planning baseline

## Routes

| Route | Screen ID |
| --- | --- |
| `/admin/platform` | `platform.dashboard` |
| `/admin/platform/tenants` | `platform.tenants.list` |
| `/admin/platform/tenants/:id` | `platform.tenant.detail` |
| `/admin/platform/provisioning` | `platform.provisioning` |
| `/admin/platform/support` | `platform.support` |
| `/admin/platform/feature-flags` | `platform.featureFlags` |
| `/admin/platform/audit` | `platform.audit` |

## Screen Requirements

- Dashboard must degrade gracefully when one telemetry source is unavailable.
- Tenant detail must separate readonly metadata, status actions, support actions, and audit history.
- Support view must require reason before sensitive details load.
- Feature flags must show scope, default value, current override, and safety notes.
- Maintenance mode must show affected apps and exact public message.

## States

Admin screens must include loading, empty, forbidden, validation, conflict, server-error, and partial-health states.
