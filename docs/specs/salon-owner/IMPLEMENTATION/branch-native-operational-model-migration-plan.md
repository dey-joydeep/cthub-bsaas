# Branch-Native Operational Model Migration Plan

**Date:** 2026-06-13  
**Status:** Planned for later execution  
**Target branch:** A dedicated branch created only after explicit approval  
**Primary objective:** Retire the legacy `Salon` aggregate and make `SalonBusiness` plus `SalonBranch` the authoritative operating model.

## 1. Purpose

This document defines the implementation plan for removing runtime dependence on the legacy Prisma `Salon` model.

It is intentionally an execution plan rather than an implementation change. The migration must be delivered through multiple independently deployable pull requests using an expand, migrate, verify, and contract sequence.

The migration is complete only when:

- `SalonBranch.id` is the canonical physical-location identifier;
- branch-scoped APIs, database relations, events, jobs, and web models use `branchId`;
- business-scoped behavior uses `salonBusinessId`;
- no production code reads from or writes to the legacy `Salon` table;
- all legacy `salon_id` foreign keys have been replaced according to domain ownership;
- compatibility synchronization has been removed;
- the `Salon` Prisma model and database table have been dropped.

## 2. Source Of Truth

| Source                                                                                             | Role                                                                                        |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [Business Operating Model](../FRD/business-operating-model.md)                                     | Defines `SalonBusiness` as the business root and Branch as the physical operating location. |
| [Business Rules](../FRD/business-rules.md)                                                         | Defines tenant, business, and branch scoping rules.                                         |
| [Data Model HLD](../HLD/data-model.md)                                                             | Defines target entity ownership and branch-scoped operational records.                      |
| [Domain Architecture](../HLD/domain-architecture.md)                                               | Defines bounded contexts and dependency direction.                                          |
| [MVP LLD](../LLD/mvp-lld.md)                                                                       | Defines repository scoping and transaction requirements.                                    |
| [Service Contracts](../LLD/service-contracts.md)                                                   | Defines branch-aware commands, queries, and read models.                                    |
| [Salon Owner OpenAPI](../API/openapi.yaml)                                                         | Defines the target public partner API contract.                                             |
| [Project-Wide Implementation Slicing](../../project-wide/IMPLEMENTATION/implementation-slicing.md) | Defines branch strategy and validation gates.                                               |
| [Legacy Salon Dependency Inventory](legacy-salon-dependency-inventory.md)                          | Classifies schema, runtime, contract, web, and test migration dependencies.                 |

Any implementation discovery that contradicts a binding FRD rule must update the FRD before changing code.

## 3. Current State

### 3.1 Duplicate Location Aggregates

The repository currently has two models representing a physical salon location:

| Model         | Current responsibility                                                                                                                                                |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SalonBranch` | New settings model: business membership, profile, timezone, currency, JSON address, hours, holidays, and policy.                                                      |
| `Salon`       | Legacy operational model: owner, tenant, normalized address, slug, public profile fields, services, staff, portfolios, translations, invites, and registration links. |

There is no database foreign key between these models.

The temporary compatibility rule is:

```text
SalonBranch.id == Salon.id
```

Branch profile creation and updates currently synchronize a corresponding `Salon` row in the same transaction. This prevents newly created branches from being invisible to legacy operational code, but it does not remove structural duplication.

### 3.2 Direct Legacy Database Dependencies

The following Prisma models currently depend directly on `Salon`:

| Current model      | Current relation          | Target ownership                                                                                                                       |
| ------------------ | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `SalonTenantStaff` | `salonId -> Salon.id`     | Staff profile belongs to a business; branch access uses explicit branch assignments.                                                   |
| `Portfolio`        | `salonId -> Salon.id`     | Decide and document business-level versus branch-level portfolio ownership; default recommendation is branch-level for location media. |
| `SalonTranslation` | `salonId -> Salon.id`     | Branch public-profile translation, unless a field is explicitly business-brand content.                                                |
| `SalonService`     | `salonId -> Salon.id`     | Service master belongs to `SalonBusiness`; branch differences use `BranchServiceOverride`.                                             |
| `RegistrationLink` | `salonId -> Salon.id`     | Owner registration is business-scoped, with optional initial branch context.                                                           |
| `StaffInvite`      | `salonId -> Salon.id`     | Staff invite is business-scoped and carries one or more initial branch assignments.                                                    |
| `BusinessAddress`  | optional `Salon` relation | Branch owns a normalized address relation.                                                                                             |

Appointments do not currently have a direct `Salon` foreign key. Their effective location is inferred through tenant, staff, and selected `SalonService` records. The target model requires explicit `salonBusinessId` and `branchId` on appointments.

### 3.3 Application Dependency Areas

The inventory found legacy salon concepts in these server areas:

- `server-feature-appointment`
- `server-feature-auth`
- `server-feature-portfolio`
- `server-feature-review`
- `server-feature-salon`
- `server-feature-salon-owner`
- `server-feature-salon-staff-request`
- `server-feature-dashboard`
- `server-feature-user`
- `server-contracts-auth`
- `server-core`
- `server-infrastructure`

The web inventory found legacy salon models or parameters in:

- partner appointment, owner, staff, service, product, portfolio, and dashboard features;
- public salon discovery, search, top-salon, tenant, and booking features;
- admin salon management, appointment, staff, service approval, and dashboard features;
- customer appointment and review features.

These references must be classified before editing:

| Classification                       | Required treatment                                                                                                                     |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Physical location identifier         | Rename contract and implementation to `branchId`.                                                                                      |
| Business or brand identifier         | Replace with `salonBusinessId`, not `branchId`.                                                                                        |
| Tenant boundary                      | Keep `tenantId`; do not substitute branch ID.                                                                                          |
| Public display term                  | The UI may continue displaying “salon” where that is the product language, while internal identifiers remain branch/business explicit. |
| Dead, placeholder, or mock-only code | Remove or modernize rather than migrating obsolete behavior.                                                                           |

## 4. Target Architecture

### 4.1 Aggregate Ownership

| Aggregate/entity                   | Target responsibility                                                                                                                   |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `SalonTenant`                      | SaaS tenant boundary, subscription, and tenant-wide configuration.                                                                      |
| `SalonBusiness`                    | Business/brand root, legal identity, ownership/membership, business-level service catalog, customers, and cross-branch policy defaults. |
| `SalonBranch`                      | Physical location, normalized address, timezone, currency, public location profile, branch status, hours, holidays, and branch policy.  |
| `BusinessMembership` or equivalent | User-to-business role and permissions. Do not keep ownership on a physical branch merely because legacy `Salon.ownerId` did.            |
| `StaffProfile`                     | Business-level staff identity and employment state.                                                                                     |
| `StaffBranchAssignment`            | Many-to-many staff-to-branch assignment, status, and branch-specific permissions or position where required.                            |
| `Service`                          | Business-owned service definition.                                                                                                      |
| `BranchServiceOverride`            | Branch availability, price, duration, and status overrides.                                                                             |
| `Appointment`                      | Explicit tenant, business, and branch scope plus customer and staff/service lines.                                                      |

### 4.2 Canonical Identifier Rules

- `tenantId` identifies the SaaS account boundary.
- `salonBusinessId` identifies the business/brand.
- `branchId` identifies the physical operating location.
- New public and internal contracts must not use an ambiguous `salonId`.
- During compatibility phases, legacy `salonId` values map directly to `branchId` because IDs are currently shared.
- The mapping must be verified before any foreign key conversion.

### 4.3 Target Branch Shape

Before `Salon` can be removed, `SalonBranch` must absorb or replace every legitimate location-owned field:

| Legacy `Salon` field           | Target                                                                                                                             |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `id`                           | `SalonBranch.id`                                                                                                                   |
| `tenantId`                     | Derive through `SalonBranch.business.tenantId`; add denormalized `tenantId` only if query performance and constraints justify it.  |
| `businessAddressId`            | Add a required normalized address relation to `SalonBranch`. Remove the JSON address after migration.                              |
| `name`                         | `SalonBranch.name`                                                                                                                 |
| `slug`                         | Add unique branch/public-profile slug with documented uniqueness scope.                                                            |
| `description`                  | Add to branch public profile.                                                                                                      |
| `phone`, `email`, `website`    | Add or retain on branch profile.                                                                                                   |
| `logoUrl`, `coverImageUrl`     | Decide business-brand versus branch-profile ownership before schema work. Recommended: business logo, optional branch cover/media. |
| `isActive`                     | Use `SalonBranch.status`.                                                                                                          |
| `isVerified`, `isFeatured`     | Branch discovery/publication state or a dedicated public-profile model.                                                            |
| `averageRating`, `reviewCount` | Derived read-model fields; do not treat them as authoritative mutable branch settings.                                             |
| `ownerId`                      | Move to business membership/ownership. Do not add branch owner as a permanent replacement.                                         |
| `metadata.timezone`            | Use `SalonBranch.timezone`; migrate other metadata keys explicitly.                                                                |

### 4.4 Address Decision

The JSON `SalonBranch.address` is insufficient as the permanent operational address because the current system uses normalized `Country`, `State`, `City`, and `BusinessAddress` relations.

The recommended target is:

```text
SalonBranch.businessAddressId -> BusinessAddress.id
```

Migration rules:

- introduce `businessAddressId` as nullable during expansion;
- backfill it from the same-ID legacy `Salon`;
- dual-write structured address changes during the transition;
- validate every active branch has a normalized address;
- make the relation required;
- remove `SalonBranch.address` JSON only after all clients and readers use the normalized branch address.

## 5. Decisions Required Before Coding

These are architecture decisions, not implementation details. They must be resolved in FRD/HLD before the first schema PR.

| Decision                      | Recommended default                                                                                                  |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Business ownership model      | Add business membership/role records rather than moving `Salon.ownerId` onto Branch.                                 |
| Staff branch scope            | Business-level staff plus many-to-many branch assignments.                                                           |
| Service ownership             | Business-level service master plus branch overrides, matching the existing Salon Owner HLD.                          |
| Portfolio ownership           | Branch-level for location gallery; business-level brand media should use a separate business profile/media relation. |
| Translation ownership         | Split business-brand translations from branch-location translations if both are required.                            |
| Owner registration link scope | `salonBusinessId`, with optional initial `branchId`.                                                                 |
| Staff invite scope            | `salonBusinessId` plus an explicit list of initial `branchIds`.                                                      |
| Public URL semantics          | Prefer branch slug for physical-location pages; preserve redirects from legacy salon URLs during rollout.            |
| Rating ownership              | Branch-level rating aggregate, derived from reviews.                                                                 |
| Compatibility duration        | At least one successful production release with branch-native reads before dropping legacy columns/table.            |

## 6. Migration Strategy

The program uses five stages:

```text
Expand schema
  -> Dual write
  -> Backfill and verify
  -> Switch reads/contracts
  -> Contract and remove legacy model
```

No PR may combine initial schema expansion with dropping the legacy table.

### Stage A: Expand

- Add target branch/business relations and nullable columns.
- Add compatibility repository interfaces and typed identifier aliases.
- Keep all existing production behavior working.
- Add database indexes needed by branch-native queries.
- Add observability for missing or divergent branch mappings.

### Stage B: Dual Write

- Write branch-native records first within the transaction.
- Keep legacy writes only where an unmigrated consumer still requires them.
- Record or alert on synchronization failure.
- Do not introduce new direct `Salon` dependencies.

### Stage C: Backfill And Verify

- Backfill new columns and relations using the same-ID mapping.
- Run deterministic consistency queries.
- Repair or quarantine invalid records.
- Make new constraints required only after zero invalid records are confirmed.

### Stage D: Read Switch

- Move each bounded context to branch-native reads.
- Keep temporary contract aliases only where external compatibility requires them.
- Compare old and new read results in tests and, where practical, production telemetry.

### Stage E: Contract

- Remove legacy writes and compatibility adapters.
- Drop legacy foreign keys and columns.
- Remove `Salon` relations from Prisma.
- Drop the `salon` table in a final dedicated migration.
- Remove temporary redirects or aliases only under the documented API deprecation policy.

## 7. Pull Request Execution Plan

Each PR must be deployable and reversible independently.

### PR 1: Architecture And Contract Baseline

**Branch:** `docs/branch-native-operational-model`

Scope:

- approve the decisions in section 5;
- update FRD/HLD/LLD ownership rules;
- add API naming/deprecation rules;
- add validation and test migration requirements;
- create a complete legacy dependency inventory;
- use the companion [Legacy Salon Dependency Inventory](legacy-salon-dependency-inventory.md) as the reviewed baseline;
- define the compatibility release window.

Exit criteria:

- no unresolved ownership decisions;
- every current `salonId` use is classified as tenant, business, branch, public terminology, or obsolete;
- OpenAPI impact is identified for auth, salon-owner, public, admin, and customer APIs.

### PR 2: Schema Expansion And Compatibility Foundation

**Branch:** `feature/server-branch-native-foundation`

Scope:

- add normalized address relation and missing location-owned fields to `SalonBranch`;
- introduce business membership/ownership model if approved;
- add branch identifier types and repository contracts;
- add migration consistency diagnostics;
- preserve the same-ID compatibility rule;
- keep `Salon` and existing FKs intact.

Exit criteria:

- old application behavior remains green;
- every `SalonBranch` can represent a complete operational location;
- no destructive migration is included;
- schema migration succeeds against both empty and representative populated databases.

### PR 3: Staff And Invite Scope Migration

**Branch:** `feature/server-branch-native-staff`

Scope:

- replace `SalonTenantStaff.salonId` with business-level staff ownership and branch assignments;
- migrate last-admin validation to business membership/role semantics;
- change staff invite records to business plus branch assignments;
- change owner registration links to business scope;
- update Auth ports, DTOs, tests, and OpenAPI contracts;
- preserve safe handling of existing invite tokens during the compatibility window.

Backfill:

- map each legacy staff `salonId` to the same-ID `branchId`;
- derive `salonBusinessId` from that branch;
- create one initial `StaffBranchAssignment`;
- reject or report orphaned staff records.

Exit criteria:

- staff authorization is enforced through business membership and branch assignment;
- no auth/invite production code loads `Salon`;
- concurrent invite acceptance remains atomic;
- auth unit and integration coverage remains at required thresholds.

### PR 4: Service Catalog Migration

**Branch:** `feature/server-branch-native-services`

Scope:

- replace `SalonService.salonId`;
- introduce or complete business-owned `Service`;
- introduce `BranchServiceOverride`;
- migrate tenant-service joins and review references;
- update service DTOs, repositories, and web clients.

Backfill:

- group legacy services by business;
- preserve branch-specific price, duration, active state, and position as overrides;
- define deterministic handling for duplicate services across branches;
- retain immutable snapshots in historical appointment lines.

Exit criteria:

- service selection is explicitly business and branch scoped;
- no service query derives branch scope through `Salon`;
- duplicate-service migration rules are tested.

### PR 5: Appointment Migration

**Branch:** `feature/server-branch-native-appointments`

Scope:

- add required `salonBusinessId` and `branchId` to `Appointment`;
- update create, search, reschedule, cancellation, availability, and dashboard queries;
- change appointment API fields from ambiguous `salonId` to `branchId`;
- update partner, admin, customer, and public web models;
- update indexes for branch board and availability queries.

Backfill:

- derive branch from the appointment’s service lines and staff assignment;
- detect appointments whose service lines point to different branches;
- define a repair policy for appointments with no service line or ambiguous branch;
- populate business from Branch.

Exit criteria:

- every appointment has one explicit branch;
- availability and future-appointment blockers query `branchId` directly;
- no appointment code reads `Salon`;
- contract and E2E booking flows pass.

### PR 6: Portfolio, Translation, Review, And Public Discovery Migration

**Branch:** `feature/server-branch-native-public-profile`

Scope:

- move branch-owned portfolios to `branchId`;
- split or migrate translations according to approved ownership;
- move public profile and discovery reads to Branch;
- migrate rating/review aggregates to Branch;
- provide legacy URL redirects where required;
- update public and admin web clients.

Exit criteria:

- public search and profile pages use branch-native data;
- public URLs have tested redirect behavior;
- no public discovery or portfolio code reads `Salon`.

### PR 7: Remaining Operational And Admin Consumers

**Branch:** `feature/server-branch-native-consumers`

Scope:

- migrate dashboard, user, staff-request, review, admin approval, and miscellaneous consumers;
- remove or replace the legacy `server-feature-salon` implementation;
- delete obsolete mock-only salon services and models;
- update shared and web model names where they represent identifiers rather than display terminology.

Exit criteria:

- repository-wide production-code search finds no direct `prisma.salon` use;
- new code cannot import a legacy `Salon` application model;
- web builds and type-checks pass with branch/business identifiers.

### PR 8: Disable Legacy Writes And Run Compatibility Release

**Branch:** `feature/server-disable-legacy-salon-writes`

Scope:

- stop creating/updating `Salon` from branch settings;
- remove dual-write code;
- retain read-only legacy table access only for explicit compatibility checks;
- add metrics or scheduled checks for legacy read attempts;
- deploy for at least one agreed compatibility release.

Exit criteria:

- zero production legacy writes;
- zero unexpected legacy reads during the observation window;
- branch-native data reconciliation reports no divergence.

### PR 9: Legacy Schema Removal

**Branch:** `feature/remove-legacy-salon-model`

Scope:

- drop remaining `salon_id` columns and legacy FKs after replacements are required;
- remove Prisma `Salon` model and relations;
- drop the `salon` table;
- remove compatibility code, tests, temporary metrics, and transitional documentation;
- update the data model HLD from transitional to final state.

Exit criteria:

- Prisma generation, migration, build, tests, and E2E pass without `Salon`;
- repository search finds no schema/code use of `Salon` as an entity or `salonId` as an identifier;
- allowed uses of “salon” are only product terminology or historical migration comments;
- rollback procedure has been tested before merge.

## 8. Database Migration Detail

### 8.1 Pre-Migration Assertions

Before converting any foreign key:

- every legacy `Salon.id` must have a matching `SalonBranch.id`;
- both records must resolve to the same tenant;
- every Branch must resolve to one `SalonBusiness`;
- every active Branch must have a valid normalized address;
- no target FK source row may reference an absent branch;
- all ambiguous appointment and service records must be reported.

Representative verification queries must be included with each migration. Examples:

```sql
SELECT s.id
FROM salon s
LEFT JOIN salon_branch b ON b.id = s.id
WHERE b.id IS NULL;
```

```sql
SELECT b.id
FROM salon_branch b
JOIN salon_business sb ON sb.id = b.business_id
JOIN salon s ON s.id = b.id
WHERE sb.tenant_id <> s.tenant_id;
```

The expected result for both queries is zero rows.

### 8.2 Column Conversion Pattern

For each legacy foreign key:

1. Add the new nullable target column.
2. Backfill in bounded batches where table size warrants it.
3. Add the target index.
4. Add a `NOT VALID` foreign key where PostgreSQL deployment practice permits.
5. Validate the foreign key.
6. Update application reads and writes.
7. Verify null/orphan counts are zero.
8. Make the new column required.
9. Stop writing the legacy column.
10. Drop the legacy FK and column in a later PR.

### 8.3 Data Reconciliation

Each migration PR must include a repeatable reconciliation script or SQL report covering:

- row counts by tenant, business, and branch;
- missing mappings;
- duplicate mappings;
- tenant mismatches;
- inactive/status mismatches;
- address mismatches;
- staff assignment counts;
- service and override counts;
- appointment branch ambiguity;
- invite and registration scope;
- public profile and portfolio ownership.

Reports must contain identifiers and counts, not customer secrets.

## 9. API And Compatibility Plan

### 9.1 Contract Naming

- New request and response fields use `branchId` or `salonBusinessId`.
- Do not introduce new `salonId` fields.
- Existing external `salonId` fields require an explicit compatibility decision:
  - immediate breaking change before production adoption;
  - temporary deprecated alias;
  - versioned endpoint.

### 9.2 Temporary Alias Rules

Where an alias is required:

- accept only one of `salonId` and `branchId`, or require equal values if both are supplied;
- normalize internally to `branchId`;
- return `branchId` in the canonical response;
- mark `salonId` deprecated in OpenAPI;
- add telemetry for alias usage;
- publish a removal release/date.

### 9.3 Events, Audit, And Jobs

- New event payloads use explicit `tenantId`, `salonBusinessId`, and `branchId`.
- Existing event consumers must support the new payload before producers stop emitting legacy fields.
- Audit targets must distinguish business and branch resources.
- Background jobs, cache keys, and idempotency keys must be inventoried for embedded `salonId`.

## 10. Testing Strategy

### 10.1 Required Test Layers

| Layer            | Required coverage                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Schema/migration | Empty DB, populated DB, duplicate data, orphan data, rollback rehearsal, and constraint validation.                                  |
| Unit             | Identifier normalization, scope enforcement, mapper behavior, dual-write behavior, and legacy fallback removal.                      |
| Integration      | Tenant/business/branch isolation, FK correctness, transaction atomicity, and concurrency.                                            |
| Contract         | OpenAPI lint, route parity, deprecated alias behavior, and response field migration.                                                 |
| E2E              | Owner branch management, staff invite/assignment, service setup, booking, reschedule, cancellation, portfolio, and public discovery. |
| Security         | Cross-tenant, cross-business, and unauthorized branch access.                                                                        |
| Performance      | Branch-board, availability, discovery, and dashboard query plans after index changes.                                                |

### 10.2 Mandatory Regression Scenarios

- A tenant with multiple businesses and multiple branches.
- One owner managing multiple branches.
- One staff member assigned to multiple branches.
- A service available at multiple branches with different price or duration.
- Appointment creation with explicit branch and a service unavailable at that branch.
- Existing invite tokens created before a compatibility deployment.
- Existing public salon URL resolving to the correct branch page.
- Branch deactivation with future appointments.
- Concurrent branch/profile updates.
- Concurrent invite acceptance for different businesses.
- Migration rerun/idempotency behavior where supported.

## 11. Validation Matrix

Commands must be adjusted to the projects touched by each PR, but the minimum program gates are:

```powershell
npx prisma validate --schema libs/server/data-access/prisma/schema.prisma
npx prisma generate --schema libs/server/data-access/prisma/schema.prisma
npm exec nx affected -t lint,test,build,type-check
git diff --check
```

Feature-specific gates include:

```powershell
npm exec nx test server-feature-salon-owner --configuration=ut
npm exec nx test server-feature-salon-owner --configuration=it
npm exec nx test server-feature-auth --configuration=ut
npm exec nx test server-feature-auth --configuration=it
npm exec nx test server-feature-appointment --configuration=ut
npm exec nx test server-feature-appointment --configuration=it
npm exec nx lint <touched-project>
npm exec nx build <touched-project>
```

OpenAPI changes require:

```powershell
node_modules/.bin/redocly.cmd lint docs/specs/salon-owner/API/openapi.yaml --config .redocly.yaml --max-problems=0
node_modules/.bin/redocly.cmd lint docs/specs/auth/API/openapi.yaml --config .redocly.yaml --max-problems=0
node_modules/.bin/tsx.cmd scripts/openapi-auth-check.ts
```

Database-backed integration tests require the repository test database configuration.

## 12. Deployment And Rollback

### 12.1 Deployment Rules

- Deploy schema expansion before code that requires new columns.
- Deploy readers only after backfill and constraints are verified.
- Deploy writers before removing compatibility reads.
- Do not drop legacy data in the same release that first stops reading it.
- Take a production backup before destructive migration.
- Record reconciliation counts before and after each deployment.

### 12.2 Rollback Rules

Before the final drop:

- application rollback may resume legacy reads because the table and dual-written data still exist;
- migrations must not remove legacy columns during the compatibility window;
- feature flags may switch selected read paths back where justified.

After the final drop:

- rollback requires restoring the legacy schema and data from the final snapshot or a tested reverse migration;
- therefore the final removal PR requires a rehearsed restore procedure and explicit deployment approval.

## 13. Observability

During migration, add temporary metrics or structured logs for:

- branch without matching legacy Salon;
- legacy Salon without matching Branch;
- tenant/business mapping mismatch;
- legacy API alias usage;
- legacy repository read/write attempts;
- appointment branch ambiguity;
- invite or staff assignment scope conflict;
- reconciliation failures.

Every log must include correlation ID and non-sensitive tenant/business/branch identifiers where permitted.

## 14. Risks And Mitigations

| Risk                                                                | Mitigation                                                                                    |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Mechanical `salonId -> branchId` rename assigns the wrong ownership | Classify every reference before editing; use business IDs for business-owned entities.        |
| Multi-branch staff is collapsed to one branch                       | Introduce branch assignment join records before removing legacy staff FK.                     |
| Service duplicates produce data loss                                | Define deterministic business-service merge and branch override rules before backfill.        |
| Appointments cannot be assigned one branch                          | Produce ambiguity report and repair policy before making `branchId` required.                 |
| Public URLs or clients break                                        | Use versioning or deprecated aliases and redirects with telemetry.                            |
| Dual-write divergence                                               | Keep writes transactional and run reconciliation continuously.                                |
| Long-running migration locks tables                                 | Use expand/contract migrations, staged indexes, validated constraints, and bounded backfills. |
| Owner semantics remain tied to a location                           | Move ownership to business membership rather than copying `ownerId` to Branch.                |
| Hidden mocks/placeholders mask missing production behavior          | Remove obsolete code and require integration/E2E verification for each migrated flow.         |

## 15. Definition Of Ready

Implementation may begin only when:

- section 5 decisions are approved and reflected in FRD/HLD;
- the dependency inventory is reviewed by backend, web, and QA owners;
- the target Prisma schema is reviewed;
- migration and rollback strategies are approved;
- affected OpenAPI contracts are identified;
- representative populated test data exists;
- each PR has named Nx projects and validation commands.

## 16. Definition Of Done

The overall program is done only when:

- `SalonBranch` is the only physical-location aggregate;
- all operational records have explicit correct business and branch scope;
- no production code calls `prisma.salon`;
- no Prisma relation references `Salon`;
- no API uses ambiguous `salonId` as an identifier;
- the `salon` table is removed;
- all migrations and rollback rehearsals pass;
- all affected unit, integration, contract, web, and E2E tests pass;
- transitional sync code and documentation are removed;
- final HLD and LLD describe only the branch-native model.

## 17. Execution Checklist

- [ ] Approve target ownership decisions.
- [ ] Create and review full dependency inventory.
- [ ] Update FRD/HLD/LLD/API/Validation/Test documents.
- [ ] Expand Branch schema without destructive changes.
- [ ] Introduce business membership and staff branch assignments.
- [ ] Migrate invites and registration scope.
- [ ] Migrate service catalog and branch overrides.
- [ ] Add explicit appointment business and branch scope.
- [ ] Migrate portfolio, translation, review, and public discovery.
- [ ] Migrate remaining server and web consumers.
- [ ] Disable legacy writes.
- [ ] Complete compatibility observation release.
- [ ] Verify zero legacy reads/writes and zero reconciliation errors.
- [ ] Drop legacy FKs, columns, Prisma model, and table.
- [ ] Remove temporary aliases, redirects, metrics, and transitional docs.
