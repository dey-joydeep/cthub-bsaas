# Backend Reliability Evidence

**Status:** Current AIDD operating guide

NestJS is an acceptable API runtime for the salon SaaS. Capacity and correctness are properties of a measured workload, database design, and deployment, not a framework label. Every consequential backend slice must state the workload and provide the evidence below before QA and release handoff.

## Data integrity

For tenant or branch scoped writes, the developer and database architect identify the database invariant, isolation level, uniqueness or exclusion constraint, retry boundary, and cleanup or correction path. QA proves the invariant against PostgreSQL using the validated `test` profile in [Database Access Policy](database-access-policy.md). A mock-only test does not prove concurrent behavior.

At minimum, test authorized access, cross-tenant denial, same-key replay, same-key changed-payload conflict, and simultaneous requests that contend for the same resource. Assert the persisted rows and audit/event records, not only HTTP status. Booking must prove no double booking; payment and invoice flows must prove one financial effect per logical request; stock movement must prove ledger and balance consistency. Add these domain tests when those flows are implemented rather than inventing passing tests for planned features.

The current representative check is `salon-owner-settings.database.it-spec.ts`. The salon-owner Jest default and `it` configurations bind the guarded test URL, apply versioned migrations, and assert the hand-written idempotency index exists. The shared Auth test setup also applies migrations. A test database previously prepared only with `db push` may need a fresh isolated test instance before migration deployment; do not reset a non-test target. Run database-backed targets sequentially when they share a test database. A failed or unavailable database is a missing validation result, never a pass.

## Capacity profile

Record the endpoint or service operation, fixture size, concurrency, sample count, hardware, Node version, database host/profile, p50/p95/p99 latency, throughput, error rate, event-loop delay, and event-loop utilization. Record a baseline and compare a changed implementation under the same profile. A local measurement is diagnostic; it is not a production SLO or a substitute for a staged HTTP test.

The local read-path probe uses only the validated test database and cleans up its generated tenant, user, and businesses. From the repository root in PowerShell, with the test PostgreSQL service running:

```powershell
$env:NODE_ENV = 'test'
$env:AIDD_PROBE_BUSINESSES = '1000'
$env:AIDD_PROBE_REQUESTS = '200'
$env:AIDD_PROBE_CONCURRENCY = '10'
node --import tsx scripts/aidd/salon-owner-capacity-probe.mjs
```

The probe repeats the `SalonOwnerSettingsService.listBusinesses` database query pair against PostgreSQL. It does not measure service mapping, HTTP middleware, authentication, browser rendering, or network transit. Those need a separate staged API profile with test data and a recorded endpoint contract. Do not run load or fixture creation against local, staging, or production databases under the test profile.

## CPU work and event loop

Before adding image processing, report generation, bulk imports, cryptography, or other potentially long CPU work to an API handler, the developer estimates input size and measures event-loop delay under representative concurrency. Keep bounded, small work in the request path only when the measured latency and delay budget hold. Move long work to a worker process or queue with idempotent jobs, bounded concurrency, retry/dead-letter behavior, and traceable status. The database architect reviews any new job state and transaction boundary; DevOps reviews worker capacity and failure recovery; QA tests retry, duplicate delivery, and cancellation where applicable.

## Handoff

The developer links the test and measurement record in the PR. QA states which invariants and load profiles passed, failed, or were not run. The database architect confirms schema and query-plan assumptions. DevOps confirms runtime metrics, alert thresholds, and rollback or capacity response. Codex review checks the evidence independently for critical data, security, and architecture changes. The release agent does not infer readiness from a passing unit suite or a single local benchmark.
