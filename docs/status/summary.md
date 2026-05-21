# Project Status Summary

**Updated:** 2026-05-20

This folder tracks current documentation and implementation-readiness status. It is not a release-management dashboard.

## Current Main-Branch Status

| Workstream                          | Status                                | Source                                                                    |
| ----------------------------------- | ------------------------------------- | ------------------------------------------------------------------------- |
| Auth backend foundation             | Complete for current backend scope    | [Auth backend status](auth/auth-backend-plan-and-progress-status.md)      |
| Frontend restructuring foundation   | Complete for current foundation scope | Git history and frontend branch merge notes                               |
| Salon Owner user stories            | Complete as current product baseline  | [Salon Owner US index](../us/salon-owner/README.md)                       |
| Salon Owner MVP specs               | Complete as implementation baseline   | [Salon Owner spec index](../specs/salon-owner/README.md)                  |
| Project-wide documentation baseline | Complete as current planning baseline | [Documentation readiness review](project-wide-documentation-readiness.md) |
| Infrastructure upgrade planning     | Available for future upgrade work     | [Infra upgrade plan](../infra-upgrade/20260501/README.md)                 |

## Current Source-Of-Truth Map

| Area                                                       | Use first                                                                                 |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Auth backend implementation and route contract             | `docs/specs/auth/API/openapi.yaml`, Auth API HLD/LLD, and `scripts/openapi-auth-check.ts` |
| Salon Owner MVP implementation planning                    | `docs/specs/salon-owner/README.md`                                                        |
| Product-level user stories                                 | `docs/us/README.md` and `docs/us/status-matrix.md`                                        |
| Documentation quality rules                                | `docs/quality-standards/production-documentation-standard.md`                             |
| Visual and diagram standards                               | `docs/quality-standards/visual-collaboration-guideline.md`                                |
| Project-wide documentation readiness                       | `docs/status/project-wide-documentation-readiness.md`                                     |
| Project-wide supporting OpenAPI and implementation slicing | `docs/specs/project-wide/README.md`                                                       |

## Remaining Documentation Cleanup

The project-wide documentation PR stack has been merged. Legacy spec folders were reviewed, reconciled into current production-level docs where useful, and removed when they were obsolete or only future-scope placeholders.

## Current Guidance

Do not implement Salon Owner MVP features directly from the user stories alone. Start from the Salon Owner FRD/FNRD documents, then use the HLD/LLD/API/Web/Validation/Test documents and the project-wide implementation slicing plan as the implementation baseline.
