# App Shell Specs

**Date:** 2026-05-18
**Status:** Current planning baseline

## Purpose

Define the shared web shell, navigation, role-aware layout, language selector, profile menu, notification entry points, cart/checkout entry points, and global UI states used by Admin, Partner, and Customer apps.

## Source User Stories

- [App Shell And Navigation User Stories](../../us/app-shell/README.md)
- [Shared Cross-Cutting Specs](../shared/README.md)

## Documents

| Area       | Document                                                      |
| ---------- | ------------------------------------------------------------- |
| FRD        | [Functional Requirements](FRD/app-shell.md)                   |
| HLD        | [Architecture](HLD/app-shell.md)                              |
| LLD        | [Implementation Design](LLD/app-shell.md)                     |
| API        | [Endpoint Map](API/endpoint-map.md)                           |
| Web        | [Web Specification](WEB/app-shell.md)                         |
| Validation | [Validation And Controls](VALIDATION/app-shell-validation.md) |
| Test       | [Test Specification](TEST/app-shell.md)                       |
| Wireframes | [Wireframe Notes](WIREFRAMES/app-shell.md)                    |

## Implementation Rule

App shell implementation must follow the shared RBAC, API, security, observability, and testing baselines under `docs/specs/shared/**`.
