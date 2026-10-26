# Platform Admin HLD

**Date:** 2026-05-18
**Status:** Current planning baseline

## Boundary

Platform Admin owns SaaS operational administration. It must not become a bypass around feature-level business rules, tenant isolation, privacy, or audit requirements.

## Contexts

| Context                | Responsibility                                              |
| ---------------------- | ----------------------------------------------------------- |
| Tenant Operations      | Tenant/business status, provisioning, suspension, metadata. |
| Support Operations     | Scoped support views, reason capture, support audit.        |
| Platform Configuration | Feature flags, maintenance mode, global settings.           |
| Platform Health        | Health and operational dashboard read models.               |
| Audit Review           | Admin action search and review.                             |

## Security

- Mandatory MFA for admin mutation routes.
- Strong RBAC and support role separation.
- Support views must be readonly unless a specific operation is authorized.
- Platform admin APIs must use audit logging and correlation IDs.

## Diagram

See [platform-admin-support-flow.drawio](../DIAGRAMS/platform-admin-support-flow.drawio).
