# ADR-0005: Canonical Staff-Service Skills and Leave Lifecycle in Slice 4

- **Status:** Accepted
- **Date recorded:** 2026-11-05
- **Original decision date:** 2026-11-05
- **Owner:** Solution and database architects
- **Decision maker:** Product owner and lead AI coordinator
- **Related issue/PR:** [#106](https://github.com/dey-joydeep/cthub-bsaas/issues/106), [#107](https://github.com/dey-joydeep/cthub-bsaas/issues/107), [PR #45](https://github.com/dey-joydeep/cthub-bsaas/pull/45), [PR #46](https://github.com/dey-joydeep/cthub-bsaas/pull/46)
- **Supersedes / superseded by:** None

## Context

During the review of Slice 4 (Staff Management & Service Catalog), two critical architectural and data integrity flaws were discovered:

1. **Dual Source of Truth for Staff-Service Capability**: The Prisma schema and service layer maintained two separate, unsynchronized join tables: `SalonOwnerStaffSkill` (`staffId`, `serviceId`) and `SalonOwnerServiceStaffEligibility` (`serviceId`, `staffId`). Writing to staff skills did not update service eligibility, and writing to service eligibility did not update staff skills, leading to desynchronization and corrupted availability evaluation for appointment scheduling.
2. **Incomplete Leave Block Lifecycle & Scope Trap**: Staff leave blocks only supported `POST /partner/staff/{staffId}/leave-blocks` with no `GET`, `PATCH`, or `DELETE` endpoints, creating an operational dead-end where mistakes or cancellations could never be modified or removed. Furthermore, `branchId` was mandatory, which prevented modeling personal sick leave or vacation that applies across all branches where a staff member works.
3. **Multi-Business Tenant Scoping**: Staff list queries filtered by `business: { tenantId }` rather than an explicit `businessId`, risking cross-business staff data leakage in multi-business tenants.

## Decision drivers

- **Single source of truth**: Only one table must represent whether a staff member is qualified to perform a service.
- **Operational completeness**: Operators must be able to list and cancel staff leave blocks through the partner API and UI.
- **Multi-branch realism**: Personal leave must support business-wide absence (`branchId = null`), while training or meetings remain branch-specific.
- **Tenant & multi-business isolation**: Strict scoping by `businessId` to prevent data leakage.
- **Zero-drift contract**: Alignment across OpenAPI, Prisma schema, NestJS backend, and Angular frontend.

## Options

| Option                                                                                               | Benefits                                                                                                                                               | Costs and risks                                                                                                                           | Evidence                                                                                                                 |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Option A (Chosen): Consolidate to canonical `SalonOwnerStaffSkill` and complete Leave Block CRUD** | Eliminates dual-table drift; provides full leave lifecycle (`GET`, `DELETE`); allows global personal leave; ensures clean SQL foreign key constraints. | Requires updating service eligibility endpoints to write to `SalonOwnerStaffSkill` and dropping the redundant table via Prisma migration. | Slice 4 code audit and architecture review confirmed dual desynchronization bug and missing leave read/delete endpoints. |
| **Option B: Retain dual tables and synchronize via DB triggers / transaction hooks**                 | Keeps existing table names unchanged.                                                                                                                  | High complexity, fragile concurrency locks, double writes, prone to race conditions and drift.                                            | Rejected due to unnecessary schema duplication.                                                                          |

## Decision

1. **Consolidate on `SalonOwnerStaffSkill`**: Drop `SalonOwnerServiceStaffEligibility`. Both `PUT /partner/staff/{staffId}/skills` and `PUT /partner/services/{serviceId}/staff-eligibility` read and write to `SalonOwnerStaffSkill`.
2. **Complete Leave Block Lifecycle**:
   - Add `GET /partner/staff/{staffId}/leave-blocks` with date range query parameters (`from`, `to`).
   - Add `DELETE /partner/staff/{staffId}/leave-blocks/{leaveBlockId}`.
   - Make `SalonOwnerStaffLeaveBlock.branchId` nullable (`null` = business-wide personal leave, non-null = branch-specific blocked time).
3. **Multi-Business Isolation & RBAC**:
   - Enforce optional `businessId` query parameter on `GET /partner/staff`.
   - Apply role validation to protect administrative endpoints against unauthorized privilege escalation.
4. **Defer Advanced Commercial Features**:
   - Stylist tiered pricing, 3-phase chemical processing intervals, and commission calculation engines are explicitly deferred to Slices 6, 7, and 8.

## Consequences and follow-up

- **Database**: Migration drops `salon_owner_service_staff_eligibility` and modifies `salon_owner_staff_leave_block.branch_id` to `NULL`. Adds compound index on `(staff_id, starts_at, ends_at)`.
- **API Contract**: Update `docs/specs/salon-owner/API/openapi.yaml` with the new leave endpoints and nullable `branchId`.
- **Backend Service**: Update `StaffServiceCatalogService` and `StaffController` to implement the new methods and unified queries.
- **Frontend**: Update `libs/web/partner` staff service catalog API client and UI to allow listing and cancelling leave blocks.
- **Testing**: Maintain 100% unit test coverage thresholds for all new and touched backend routes.

## Review and history

- 2026-11-05: Proposed and accepted following Business Analyst and Solution Architect reviews of Issues #106 and #107.
