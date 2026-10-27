# Antigravity Server Guidance

Read `libs/server/AGENTS.md` for server architecture, security, Prisma, and test rules. This file adds Antigravity execution guidance only.

- Plan schema and migration changes before editing. Include the data transition, rollback approach, affected contracts, and test strategy in the handoff.
- Use the configured Prisma or Postgres MCP tools when available. Obtain connection settings from the approved environment; never put credentials or connection strings in instructions, commands, logs, or reports.
- Inspect the test database when diagnosing integration-test data. Verify the database target before queries. Use `psql` only when the root instructions' explicit-approval condition is met.
- Use read-only query plans for performance investigation by default. Execute a query with `EXPLAIN ANALYZE` only after confirming the target environment and the query's effects.
- Run affected Nx tests, lint, build, and contract checks according to scope. Send the finished change to independent Codex code and security review when applicable.
