# Database Access Policy

**Status:** Current AIDD policy

Every database operation has an explicit environment profile: `test`, `local`, `staging`, or `production`. The profile describes the target and permitted operation; `NODE_ENV` alone does not grant database access. Agents record the profile, database name, host, intended operation, and evidence in the work item without exposing connection secrets.

Only the test profile currently has an automated target guard. Local, staging, and production remain separate operating paths; adding their configuration later must not make them selectable by test setup or test commands.

| Profile    | Agent access                                              | Required boundary                                                                                                                  |
| ---------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Test       | Automated tests may create, change, and remove test data. | `NODE_ENV=test`; validated test URL; isolated `*_test` database; approved host; dedicated `*_test` account.                        |
| Local      | Development and inspection on a developer-owned database. | Explicit local connection and target check. Reset or data removal needs a stated local-only purpose.                               |
| Staging    | Release rehearsal and controlled verification.            | Separate staging credentials, reviewed operation plan, and release/DevOps coordination.                                            |
| Production | Approved operational or release action only.              | Separate production credentials, human authorization for data-changing operations, recovery plan, and recorded execution evidence. |

Test setup reads `TEST_DATABASE_URL` when supplied, otherwise the versioned `.env.test` fixture. It never derives a target from a developer's `DATABASE_URL`. The test guard binds the selected URL to both Prisma and child commands before they access the database. A test URL must not contain a `host` query parameter, which can override its apparent hostname in Prisma. `TEST_DATABASE_ALLOWED_HOSTS` is an exact, comma-separated allowlist for explicitly provisioned remote test hosts; local loopback is allowed by default. The database and account names must contain the `_test` marker. Staging and production endpoints must never be added to the test host allowlist. Host and name checks reduce mistakes; an isolated test instance or credentials restricted to the test database provide the stronger boundary.

For local test runs, start the isolated PostgreSQL service with `docker compose -f docker-compose.test.yml up -d`. Its default port and disposable credentials match `.env.test`; the published port binds to loopback only. CI starts the same test-only identity. A different test host or port can be selected with `TEST_DATABASE_URL` and, for a remote host, `TEST_DATABASE_ALLOWED_HOSTS`; never repurpose these variables for a local, staging, or production database.
Database-backed CI test targets must run sequentially against that one test database, including schema setup, reset, and coverage runs. Distributed Nx workers must not run those targets concurrently unless each worker has its own validated test database.

Before a schema change, the database architect agent reviews tenant and branch isolation, indexes, constraints, migration sequencing, data volume, backfill, and recovery. The solution architect owns the broader design; DevOps owns environment and rollout preparation. Codex independently reviews consequential migration design and all security-sensitive database changes. QA verifies migration and behavior on the isolated test database. The release agent checks staging evidence and approved production execution.

Database tools, Prisma MCP, SQL MCP, scripts, and raw CLI commands follow the same policy. Tool availability is not authorization. Never run reset, schema push with data loss, broad data deletion, or destructive SQL against staging or production as a test shortcut. Use the [migration rollout policy](../specs/shared/migration-rollout-policy.md) for staged releases and recovery notes.

## Database Seeding and Test Data Architecture

Database seeding is organized into two distinct layers to prevent monolithic scripts and cross-domain bloat:

1. **Ephemeral In-Test Fixtures:** Automated tests (`*.spec.ts`, `*.it-spec.ts`) create, isolate, and tear down their own minimal fixtures per test. Tests must not depend on mutable, pre-seeded shared transaction state.
2. **Persistent Baseline Seeds:** Maintained under `libs/server/data-access/prisma/` for local development, demo environments, E2E browser tests, and reproducible baseline staging.

### Modular Seed Structure

Baseline seed data is decomposed into numbered, dependency-ordered domain seeders located in `libs/server/data-access/prisma/seeds/`:

| Seeder                         | Domain Scope             | Entities Seeded                                                                               |
| :----------------------------- | :----------------------- | :-------------------------------------------------------------------------------------------- |
| `01-geo-currencies.seed.ts`    | Global Master            | Countries, Currencies, States, Cities, Business Addresses                                     |
| `02-roles-permissions.seed.ts` | Global Master (ADR-0005) | Legacy system roles, `PermissionMaster` capabilities, `RoleMaster` presets                    |
| `03-auth-tenants.seed.ts`      | Identity & Tenancy       | Demo users (Superadmin, Owners, Managers, Stylists, Customers), Credentials, Tenants          |
| `04-salon-branches.seed.ts`    | Business Settings        | `SalonBusiness`, cloned `BusinessRole` presets, Branches, Operating Hours, Policies, Holidays |
| `05-staff-catalog.seed.ts`     | Staff & Service Catalog  | Staff profiles, `StaffRoleAssignment`, Branch links, Skills, Shifts, Categories, Services     |
| `06-customers-crm.seed.ts`     | CRM                      | Customer profiles, restricted formulas and allergy notes                                      |
| `07-transactions.seed.ts`      | Transactions (Optional)  | Staff leave blocks, sample appointments, checkout invoices, payment captures, coupons         |

### Execution and Orchestration

The root script [`libs/server/data-access/prisma/seed.ts`](../../libs/server/data-access/prisma/seed.ts) serves as the orchestrator runner. It detects the target database profile (`test` vs `local`), handles connection safety, and executes the domain seeders sequentially.

The runner supports selective execution flags:

- `npx tsx libs/server/data-access/prisma/seed.ts` (default: runs all seeders 01–07).
- `npx tsx libs/server/data-access/prisma/seed.ts --baseline` (runs 01–06: master, tenant, staff, and catalog data without transaction records).
- `npx tsx libs/server/data-access/prisma/seed.ts --master-only` (runs 01–02: global geography, currencies, and system role/permission catalog).

### Domain Evolution Rule

When delivering a new feature or slice that introduces new database models or required initial master data, developers must extend or add to the corresponding domain module under `libs/server/data-access/prisma/seeds/` rather than appending raw queries to a monolithic seed script.
