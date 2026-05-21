# Account And Profile Specs

**Date:** 2026-05-18
**Status:** Current planning baseline

## Purpose

Define account, profile, security settings, connected accounts, notification preferences, and privacy entry points shared across Customer, Staff, Salon Owner, and Platform Admin actors.

## Source User Stories

- [Account And Profile User Stories](../../us/user/user-profile-user-story.md)
- [Auth Specs](../auth/README.md)
- [Shared Cross-Cutting Specs](../shared/README.md)

## Legacy Reconciliation

The older `docs/specs/user/**` and `docs/specs/settings/**` folders were reconciled into this baseline and removed. Optional profile fields remain out of MVP unless a role-specific flow documents ownership, validation, consent, and retention rules.

## Documents

| Area       | Document                                                            |
| ---------- | ------------------------------------------------------------------- |
| FRD        | [Functional Requirements](FRD/account-profile.md)                   |
| HLD        | [Architecture](HLD/account-profile.md)                              |
| LLD        | [Implementation Design](LLD/account-profile.md)                     |
| API        | [Endpoint Map](API/endpoint-map.md)                                 |
| Web        | [Web Specification](WEB/account-profile.md)                         |
| Validation | [Validation And Controls](VALIDATION/account-profile-validation.md) |
| Test       | [Test Specification](TEST/account-profile.md)                       |
| Wireframes | [Wireframe Notes](WIREFRAMES/account-profile.md)                    |
