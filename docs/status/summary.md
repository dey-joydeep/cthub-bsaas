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
| Infrastructure upgrade planning | Available for future upgrade work | [Infra upgrade plan](../infra-upgrade/20260501/README.md) |

## Current Source-Of-Truth Map

| Area | Use first |
| --- | --- |
| Auth backend implementation and route contract | `docs/specs/auth/API/openapi.yaml`, Auth API HLD/LLD, and `scripts/openapi-auth-check.ts` |
| Salon Owner MVP implementation planning | `docs/specs/salon-owner/README.md` |
| Product-level user stories | `docs/us/README.md` and `docs/us/status-matrix.md` |
| Documentation quality rules | `docs/quality-standards/production-documentation-standard.md` |
| Visual and diagram standards | `docs/quality-standards/visual-collaboration-guideline.md` |

## Remaining Documentation Cleanup

The following items remain outside the completed Salon Owner MVP baseline:

1. Classify or reconcile older feature specs under `docs/specs/appointment`, `docs/specs/salon`, `docs/specs/dashboard`, and related folders before using them for new implementation.
2. Create implementation slicing docs before coding the Salon Owner MVP.
3. Add production-grade HLD/LLD/API/Web/Test packs for non-owner product areas when those areas become active.
4. Keep Auth status current when Auth route scope, validation commands, or implementation status changes.

## Current Guidance

Do not implement Salon Owner MVP features directly from the user stories alone. Start from the Salon Owner FRD/FNRD documents, then use the HLD/LLD/API/Web/Validation/Test documents as the implementation baseline.
