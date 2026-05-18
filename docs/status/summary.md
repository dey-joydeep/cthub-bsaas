# Project Status Summary

**Updated:** 2026-05-18

This folder tracks current documentation and implementation-readiness status. It is not a release-management dashboard.

## Current Main-Branch Status

| Workstream | Status | Source |
| --- | --- | --- |
| Auth backend foundation | Complete for current backend scope | [Auth backend status](auth/auth-backend-plan-and-progress-status.md) |
| Frontend restructuring foundation | Complete for current foundation scope | Git history and frontend branch merge notes |
| Salon Owner user stories | Complete as current product baseline | [Salon Owner US index](../us/salon-owner/README.md) |
| Salon Owner MVP specs | Complete as implementation baseline | [Salon Owner spec index](../specs/salon-owner/README.md) |
| Project-wide documentation baseline | Open PR stack | [Documentation readiness review](project-wide-documentation-readiness.md) |
| Infrastructure upgrade planning | Available for future upgrade work | [Infra upgrade plan](../infra-upgrade/20260501/README.md) |

## Current Source-Of-Truth Map

| Area | Use first |
| --- | --- |
| Auth backend implementation and route contract | `docs/specs/auth/API/openapi.yaml`, Auth API HLD/LLD, and `scripts/openapi-auth-check.ts` |
| Salon Owner MVP implementation planning | `docs/specs/salon-owner/README.md` |
| Product-level user stories | `docs/us/README.md` and `docs/us/status-matrix.md` |
| Documentation quality rules | `docs/quality-standards/production-documentation-standard.md` |
| Visual and diagram standards | `docs/quality-standards/visual-collaboration-guideline.md` |
| Project-wide documentation readiness | `docs/status/project-wide-documentation-readiness.md` |

## Remaining Documentation Cleanup

The following items remain outside the completed Salon Owner MVP baseline on `main` until the project-wide documentation PR stack is merged:

1. Merge the project-wide documentation PR stack in order.
2. Review legacy spec deletion candidates after the reconciliation matrix is merged.
3. Create implementation slicing docs before coding new product areas.

## Current Guidance

Do not implement Salon Owner MVP features directly from the user stories alone. Start from the Salon Owner FRD/FNRD documents, then use the HLD/LLD/API/Web/Validation/Test documents as the implementation baseline.
