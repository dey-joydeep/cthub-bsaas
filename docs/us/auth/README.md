# Auth User Story Index

**Date:** 2026-05-11
**Status:** Current supporting source index

## Purpose

This folder contains consolidated Auth user-story material for Admin, Partner, and Customer apps. Before implementation, verify behavior against:

- `docs/specs/auth/API/openapi.yaml`
- `docs/specs/auth/API/api-hld.md`
- `docs/specs/auth/API/api-lld.md`
- `docs/specs/auth/WEB/docs/auth/server-alignment.md`
- current `libs/server/features/auth/**` implementation

## Document Map

| Document                                                       | Use                                             | Caveat                                                    |
| -------------------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------- |
| [auth-user-story.md](auth-user-story.md)                       | Aggregate Auth story source                     | Common auth model, sessions, CSRF, recovery, audit.       |
| [admin-auth-user-story.md](admin-auth-user-story.md)           | Platform Admin auth persona                     | Mandatory MFA, passkey/TOTP, step-up, session control.    |
| [customer-auth-registration.md](customer-auth-registration.md) | Customer registration source                    | OTP-first registration and social registration policy.    |
| [customer-auth-user-story.md](customer-auth-user-story.md)     | Customer sign-in, recovery, social login source | Low-friction sign-in, optional passkey, provider linking. |
| [partner-auth-registration.md](partner-auth-registration.md)   | Partner owner/staff onboarding source           | Owner link, staff invite, password rotation, MFA gate.    |
| [partner-auth-user-story.md](partner-auth-user-story.md)       | Partner sign-in/session source                  | Partner sign-in, MFA, tenant-scoped sessions, recovery.   |

## Implementation Rule

Do not implement Auth behavior from these stories alone. Cross-check Auth specs, OpenAPI, and current code first.
