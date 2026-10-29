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

Before a schema change, the database architect agent reviews tenant and branch isolation, indexes, constraints, migration sequencing, data volume, backfill, and recovery. The solution architect owns the broader design; DevOps owns environment and rollout preparation. Codex independently reviews consequential migration design and all security-sensitive database changes. QA verifies migration and behavior on the isolated test database. The release agent checks staging evidence and approved production execution.

Database tools, Prisma MCP, SQL MCP, scripts, and raw CLI commands follow the same policy. Tool availability is not authorization. Never run reset, schema push with data loss, broad data deletion, or destructive SQL against staging or production as a test shortcut. Use the [migration rollout policy](../specs/shared/migration-rollout-policy.md) for staged releases and recovery notes.
