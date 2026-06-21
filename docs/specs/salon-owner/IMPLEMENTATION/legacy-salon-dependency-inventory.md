# Legacy Salon Dependency Inventory

**Date:** 2026-06-13  
**Status:** Planning baseline  
**Companion plan:** [Branch-Native Operational Model Migration Plan](branch-native-operational-model-migration-plan.md)

## 1. Purpose

This inventory classifies current uses of the legacy `Salon` aggregate and ambiguous `salonId` identifier before migration work begins.

It distinguishes:

- hard database and runtime dependencies that block deleting `Salon`;
- API and TypeScript contract dependencies;
- web-client dependencies;
- test and fixture dependencies;
- product terminology that may legitimately continue using the word “salon.”

This is a planning snapshot. Each implementation PR must rerun the searches in section 9 and update the inventory when scope changes.

## 2. Classification Rules

| Code | Meaning                                            | Required action                                                                          |
| ---- | -------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `B`  | Business or brand scope                            | Replace ambiguous identifier with `salonBusinessId`.                                     |
| `L`  | Physical location scope                            | Replace ambiguous identifier with `branchId`.                                            |
| `T`  | Tenant scope                                       | Keep or correct to `tenantId`; do not replace with Branch.                               |
| `P`  | Public/product terminology                         | “Salon” may remain in display text or resource naming, but identifiers must be explicit. |
| `X`  | Obsolete, placeholder, or duplicate implementation | Remove instead of migrating.                                                             |
| `V`  | Validation/test fixture                            | Update with the production slice it validates.                                           |

## 3. Hard Schema Blockers

These relations must be migrated before the Prisma `Salon` model can be removed.

| Prisma model/relation      | Current dependency                  | Classification             | Target                                            | Planned PR           |
| -------------------------- | ----------------------------------- | -------------------------- | ------------------------------------------------- | -------------------- |
| `User.ownedSalons`         | User-to-`Salon` ownership           | `B`                        | Business membership/owner role                    | PR 2/3               |
| `SalonTenant.salons`       | Tenant-to-`Salon` collection        | `L`                        | Tenant -> Business -> Branch traversal            | PR 2, remove in PR 9 |
| `BusinessAddress.salon`    | Address-to-`Salon` one-to-one       | `L`                        | `SalonBranch.businessAddressId`                   | PR 2                 |
| `SalonTenantStaff.salonId` | Staff tied to one legacy location   | `B` + `L`                  | Business-level staff plus `StaffBranchAssignment` | PR 3                 |
| `Portfolio.salonId`        | Portfolio tied to legacy location   | `L` by recommended default | `Portfolio.branchId`                              | PR 6                 |
| `SalonTranslation.salonId` | Translation tied to legacy location | `B` or `L` by content      | Business and/or Branch translation relation       | PR 6                 |
| `SalonService.salonId`     | Service tied to one legacy location | `B` + `L`                  | Business Service plus Branch override             | PR 4                 |
| `RegistrationLink.salonId` | Owner invite tied to location       | `B`                        | `salonBusinessId`, optional initial `branchId`    | PR 3                 |
| `StaffInvite.salonId`      | Staff invite tied to location       | `B` + `L`                  | `salonBusinessId` plus initial branch assignments | PR 3                 |

### 3.1 Indirect Appointment Dependency

`Appointment` currently stores `salonTenantId`, staff, and service lines but no explicit branch. Its effective location is inferred through:

```text
Appointment
  -> AppointmentService
  -> SalonService.salonId
  -> Salon.id
```

The target must store explicit, required `Appointment.salonBusinessId` and `Appointment.branchId`.

## 4. Direct Runtime Dependencies

### 4.1 Legacy Salon Feature

| File group                                                           | Current behavior                                               | Class         | Action                                                                                                   |
| -------------------------------------------------------------------- | -------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------- |
| `libs/server/features/salon/src/lib/services/salon.service.ts`       | Direct `prisma.salon` search, read, create, update, and delete | `L`, `P`, `X` | Replace useful public-location behavior with Branch repositories; remove obsolete CRUD and placeholders. |
| `libs/server/features/salon/src/lib/controllers/salon.controller.ts` | Exposes legacy Salon feature surface                           | `P`, `X`      | Decide compatibility route, then replace or retire the controller.                                       |
| `libs/server/features/salon/src/lib/test/**`                         | Tests legacy CRUD and placeholder staff behavior               | `V`, `X`      | Replace with Branch/public-profile tests; delete obsolete tests.                                         |

This project must not be mechanically renamed. Useful public discovery behavior belongs in the public-discovery boundary, while duplicate or placeholder behavior should be removed.

### 4.2 Salon Owner Compatibility Sync

| File                                                                                     | Current behavior                                                                           | Class              | Action                                                                        |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------ | ----------------------------------------------------------------------------- |
| `libs/server/features/salon-owner/src/lib/services/salon-owner-settings.service.ts`      | Upserts same-ID `Salon` during Branch create/update and resolves owner from legacy records | `L`, compatibility | Keep through PR 7; disable in PR 8; remove in PR 9.                           |
| `libs/server/features/salon-owner/src/lib/services/salon-owner-settings.service.spec.ts` | Verifies compatibility upsert                                                              | `V`                | Retain while dual-write exists; replace with “no legacy write” tests in PR 8. |

### 4.3 Appointment

| File group                                                                      | Current dependency                                                 | Class     | Action                                                                            |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------ | --------- | --------------------------------------------------------------------------------- |
| `libs/server/features/appointment/src/lib/services/appointment.service.ts`      | Validates `salonId` by loading `prisma.salon`; maps Salon data     | `L`       | Validate Branch in business/tenant scope and persist explicit `branchId`.         |
| `libs/server/features/appointment/src/lib/models/appointment.model.ts`          | Uses `Prisma.SalonSelect`, `SalonGetPayload`, and `salonId` shapes | `L`       | Replace with Branch read models and named DTOs.                                   |
| `libs/server/features/appointment/src/lib/models/includes/service.includes.ts`  | Selects legacy `SalonService` structure                            | `B` + `L` | Migrate with service catalog and branch overrides.                                |
| `libs/server/features/appointment/src/lib/dto/**`                               | Request/filter/response fields expose `salonId`                    | `L`       | Change canonical contract to `branchId`; apply the approved compatibility policy. |
| `libs/server/features/appointment/src/lib/services/appointment.service.spec.ts` | Mocks legacy Salon validation                                      | `V`       | Replace alongside production migration.                                           |

### 4.4 Dashboard

| File                                                                   | Current dependency              | Class    | Action                                                          |
| ---------------------------------------------------------------------- | ------------------------------- | -------- | --------------------------------------------------------------- |
| `libs/server/features/dashboard/src/lib/services/dashboard.service.ts` | Counts and lists `prisma.salon` | `L`, `P` | Use Branch for location metrics and Business for brand metrics. |

Every “salon count” must be explicitly classified as business count or physical branch count.

### 4.5 Auth, Invites, And Last-Admin Validation

| File group                                                                   | Current dependency                               | Class     | Action                                                                 |
| ---------------------------------------------------------------------------- | ------------------------------------------------ | --------- | ---------------------------------------------------------------------- |
| `libs/server/contracts-auth/src/lib/ports/invite.port.ts`                    | Invite results expose `salonId`                  | `B` + `L` | Return explicit business and optional branch context.                  |
| `libs/server/infrastructure/src/lib/invite/invite.adapter.ts`                | Loads invite `salon.tenantId`; returns `salonId` | `B` + `T` | Resolve tenant through Business; create branch assignments atomically. |
| `libs/server/features/auth/src/lib/services/auth.service.ts`                 | Auth invite methods return `salonId`             | `B` + `L` | Update Auth contract and OpenAPI.                                      |
| `libs/server/features/auth/src/lib/controllers/registration.controller.ts`   | Registration validation exposes `salonId`        | `B` + `L` | Return canonical business/branch fields.                               |
| `libs/server/contracts-auth/src/lib/ports/last-admin.validator.port.ts`      | Admin safety expressed by `salonId`              | `B`       | Count business memberships/roles, not location staff rows.             |
| `libs/server/core/src/validation/validators/last-admin.validator.ts`         | Uses salon-scoped validator port                 | `B`       | Move semantics to business owner/admin membership.                     |
| `libs/server/infrastructure/src/lib/validation/prisma-last-admin.adapter.ts` | Queries `SalonTenantStaff.salonId`               | `B` + `L` | Query business membership plus staff status/assignment.                |

### 4.6 Portfolio, Reviews, Staff Requests, And Users

| File group                                               | Current dependency                                | Class                      | Action                                                                         |
| -------------------------------------------------------- | ------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------ |
| `libs/server/features/portfolio/src/lib/**`              | Filters, writes, and returns `salonId`            | `L` by recommended default | Replace with `branchId`; separate business brand media if approved.            |
| `libs/server/features/review/src/lib/**`                 | Query/model validation includes salon identifiers | `L` or service-derived     | Make reviewed Branch explicit where location rating is required.               |
| `libs/server/features/salon-staff-request/src/lib/**`    | Inherits location through staff record            | `B` + `L`                  | Use business staff profile; include Branch only for branch-specific requests.  |
| `libs/server/features/user/src/lib/models/user.model.ts` | Exposes Salon-related ownership shape             | `B`, `P`                   | Replace ownership/member fields; retain display terminology only where useful. |

## 5. Web Dependency Inventory

Web matches require contract analysis rather than blind renaming. Components may display “Salon” while request parameters and state identifiers become explicit.

### 5.1 Partner Web

| Area                                      | Representative paths                                           | Class                             | Planned PR                           |
| ----------------------------------------- | -------------------------------------------------------------- | --------------------------------- | ------------------------------------ |
| Appointment list/detail/cancel/reschedule | `libs/web/partner/src/lib/features/appointment/**`             | `L`                               | PR 5                                 |
| Owner booking and appointment management  | `features/owner/booking.service.ts`, `appointment-management*` | `L`                               | PR 5                                 |
| Salon/branch management                   | `features/owner/salon-management/**`, `salon.service.ts`       | `B`, `L`, `P`                     | PR 2/7                               |
| Staff management                          | `features/owner/staff*`                                        | `B` + `L`                         | PR 3                                 |
| Service management                        | `features/owner/service-management*`                           | `B` + `L`                         | PR 4                                 |
| Portfolio                                 | `features/owner/portfolio.service.ts`, `features/portfolio/**` | `L`                               | PR 6                                 |
| Dashboard                                 | owner dashboard and dashboard widgets                          | mixed `B`/`L`                     | PR 5/7                               |
| Products                                  | owner and partner product models/services                      | usually `B`; inventory may be `L` | Classify during POS/inventory design |

### 5.2 Public Web

| Area                         | Representative paths                        | Class                      | Planned PR |
| ---------------------------- | ------------------------------------------- | -------------------------- | ---------- |
| Salon list/search/top salons | `libs/web/public/src/lib/features/salon/**` | `P` with `L` identifiers   | PR 6       |
| Tenant/salon detail          | `features/salon/tenant/**`                  | mixed `T`, `B`, `L`, `P`   | PR 6       |
| Home featured salons         | `libs/web/public/src/lib/features/home/**`  | `P` with Branch read model | PR 6       |
| Public booking models        | tenant appointment/staff models             | `L`                        | PR 5/6     |

Public labels may remain “Salon.” Internal and URL identifiers must resolve explicitly to Branch or Business.

### 5.3 Admin Web

| Area                                          | Representative paths                                  | Class               | Planned PR |
| --------------------------------------------- | ----------------------------------------------------- | ------------------- | ---------- |
| Salon approval/list/profile/search/top salons | `libs/web/admin/src/lib/features/salon/**`            | mixed `B`, `L`, `P` | PR 6/7     |
| Appointment creation/view                     | `features/salon/components/appointments/**`           | `L`                 | PR 5       |
| Staff management                              | `features/salon/services/staff-management*`           | `B` + `L`           | PR 3/7     |
| Service approval                              | `features/salon/services/service-approval.service.ts` | `B`                 | PR 4/7     |
| Dashboard models/widgets                      | `features/dashboard/**`                               | mixed `B`/`L`       | PR 5/7     |
| Platform salon approval                       | `features/admin/components/salon-approval/**`         | decision required   | PR 7       |

Platform approval must distinguish approving a tenant, business, or physical branch.

### 5.4 Customer Web

| Area                    | Paths                                               | Class                  | Planned PR |
| ----------------------- | --------------------------------------------------- | ---------------------- | ---------- |
| Appointment list/detail | `libs/web/customer/src/lib/features/appointment/**` | `L`, `P`               | PR 5       |
| Reviews                 | `libs/web/customer/src/lib/features/reviews/**`     | `L` or service-derived | PR 6       |

## 6. Test And Fixture Dependencies

| Category                  | Paths                                                   | Treatment                                                                                           |
| ------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Auth integration fixtures | `libs/server/features/auth/tests/integration/**`        | Create Business and Branch fixtures; create legacy Salon only while compatibility tests require it. |
| Server setup/teardown     | `libs/server/server-testing-utils/src/lib/**`           | Add branch-native factories and deterministic cleanup order.                                        |
| Appointment unit fixtures | `libs/server/features/appointment/src/lib/**/*.spec.ts` | Replace Salon mocks with Branch/business/service-override fixtures.                                 |
| Invite adapter tests      | `libs/server/infrastructure/src/lib/invite/*.spec.ts`   | Test business scope, branch assignments, and concurrent acceptance.                                 |
| Last-admin tests          | core and infrastructure validator specs                 | Test business membership semantics.                                                                 |
| Portfolio tests           | `libs/server/features/portfolio/src/lib/test/**`        | Use Branch fixtures.                                                                                |
| Web specs                 | partner, public, admin, and customer feature specs      | Update canonical fields with each API slice.                                                        |

Fixtures must stop creating same-ID legacy Salon rows after PR 8.

## 7. Terminology That May Remain

The migration removes the legacy entity, not the business term “salon.”

Allowed:

- user-facing labels such as “Salon,” “Find salons,” or “Salon profile”;
- package or feature names that describe the product domain;
- historical migration comments and archived decision records;
- `SalonBusiness` and `SalonBranch` aggregate names.

Disallowed after final migration:

- `salonId` where the value is actually a Branch, Business, or Tenant identifier;
- Prisma `Salon` model references;
- `prisma.salon` calls;
- foreign keys to the dropped `salon` table;
- compatibility logic based on shared IDs.

## 8. Migration Ownership Matrix

| Planned PR                | Primary owners/projects                                       | Inventory scope                                 |
| ------------------------- | ------------------------------------------------------------- | ----------------------------------------------- |
| PR 1: Contract baseline   | docs and API owners                                           | All classifications and decisions               |
| PR 2: Foundation          | data access, salon-owner                                      | Address, ownership, Branch completeness         |
| PR 3: Staff/auth/invites  | auth, contracts-auth, core, infrastructure, partner/admin web | Staff, registration, invite, last-admin         |
| PR 4: Services            | service catalog, appointment models, partner/admin web        | `SalonService`, tenant-service joins, overrides |
| PR 5: Appointments        | appointment, dashboards, booking clients                      | Explicit business/branch scope                  |
| PR 6: Public profile      | portfolio, review, public/admin web                           | Portfolio, translations, discovery, rating      |
| PR 7: Remaining consumers | dashboard, user, salon, staff-request, remaining web          | Legacy feature removal and residual references  |
| PR 8: Disable writes      | salon-owner and observability                                 | Compatibility sync                              |
| PR 9: Remove schema       | data access and affected projects                             | Prisma model/table and final aliases            |

## 9. Repeatable Inventory Commands

### Hard server/schema references

```powershell
rg -n --glob "*.ts" --glob "*.prisma" "\bsalonId\b|salon_id|Prisma\.Salon|prisma\.salon|\bSalonSelect\b|\bSalonGetPayload\b" libs/server apps/api
```

### Web references requiring classification

```powershell
rg -n --glob "*.ts" "\bsalonId\b|salon_id|\bSalon\b" libs/web apps/web
```

### Direct runtime legacy access

```powershell
rg -n "prisma\.salon|\.salon\.(find|create|update|delete|upsert)|Prisma\.Salon" libs/server apps/api -g "*.ts"
```

### Database relations

```powershell
rg -n "salonId\s+String|salon\s+Salon|Salon\[\]|Salon\?" libs/server/data-access/prisma/schema.prisma
```

### Contracts and documentation

```powershell
rg -n --glob "*.yaml" --glob "*.md" "\bsalonId\b|salon_id|legacy `Salon`|Prisma `Salon`" docs/specs docs/us
```

## 10. Inventory Exit Gate

Before PR 9 may begin:

- [ ] No Prisma model has a relation to `Salon`.
- [ ] No production server file calls `prisma.salon`.
- [ ] No production contract exposes ambiguous `salonId`.
- [ ] Every Appointment has explicit `salonBusinessId` and `branchId`.
- [ ] Staff has business ownership and explicit branch assignments.
- [ ] Services have business ownership and branch overrides.
- [ ] Invites and registration links have explicit business/branch scope.
- [ ] Public discovery and portfolio data load from Branch/Business models.
- [ ] Web clients use canonical business/branch identifiers.
- [ ] Remaining “Salon” matches are reviewed as valid product terminology, aggregate names, or historical documentation.
