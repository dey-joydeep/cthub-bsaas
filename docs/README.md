# Documentation Index

**Updated:** 2026-11-04

This directory contains product, architecture, implementation-planning, quality, and operational documentation for the CTHub BSaaS workspace.

## Primary Entry Points

| Area                                 | Start here                                                                                                       |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Product goal and delivery life cycle | [../README.md](../README.md) and [aidd/development-lifecycle.md](aidd/development-lifecycle.md)                  |
| Current project status               | [status/summary.md](status/summary.md)                                                                           |
| Current task tracking                | [status/task-tracking.md](status/task-tracking.md)                                                               |
| User stories                         | [us/README.md](us/README.md)                                                                                     |
| Technical specs                      | [specs/README.md](specs/README.md)                                                                               |
| Architecture decisions               | [architecture/decisions/README.md](architecture/decisions/README.md)                                             |
| Salon Owner MVP specs                | [specs/salon-owner/README.md](specs/salon-owner/README.md)                                                       |
| Auth specs                           | [specs/auth/README.md](specs/auth/README.md)                                                                     |
| Frontend development principles      | [quality-standards/frontend-development-principles.md](quality-standards/frontend-development-principles.md)     |
| Production documentation rules       | [quality-standards/production-documentation-standard.md](quality-standards/production-documentation-standard.md) |
| Visual collaboration rules           | [quality-standards/visual-collaboration-guideline.md](quality-standards/visual-collaboration-guideline.md)       |
| Infrastructure upgrade planning      | [infra-upgrade/20260501/README.md](infra-upgrade/20260501/README.md)                                             |

## Source-Of-Truth Rules

- Use OpenAPI files as the source of truth for external HTTP contracts.
- Use accepted ADRs for the rationale behind consequential technical choices; proposals do not change the implementation baseline.
- Use `docs/specs/salon-owner/**` as the implementation baseline for Salon Owner MVP work.
- Use `docs/us/**` for product intent and acceptance framing, not direct implementation detail.
- Use `docs/quality-standards/**` before creating or restructuring production-ready documentation.
- Treat older feature specs as supporting material until they are reconciled in [specs/README.md](specs/README.md).
