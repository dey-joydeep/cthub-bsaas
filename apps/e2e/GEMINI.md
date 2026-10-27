# Antigravity Guidelines: E2E (`apps/e2e`)

## Scope
E2E projects live at app level:
- API E2E: `apps/e2e/api`
- Admin web E2E: `apps/e2e/web/admin`
- Customer web E2E: `apps/e2e/web/customer`
- Partner web E2E: `apps/e2e/web/partner`

## Commands
- API: `npx nx run api-e2e:e2e`
- Admin web: `npx nx run web-admin-e2e:e2e`
- Customer web: `npx nx run web-customer-e2e:e2e`
- Partner web: `npx nx run web-partner-e2e:e2e`

## Rules
- Keep E2E tests focused on user-visible happy paths and critical regressions.
- Keep library integration tests in the relevant library, not here.
- Avoid global mutable state and flaky timing assumptions.
- Use deterministic data setup and cleanup.
- Mock external IO where sensible unless the test explicitly validates an integration boundary.
- For browser tests, prefer robust locators and accessible roles.
- **Antigravity Workflow:** When a test fails, do not guess or rely purely on static analysis. Use the `@playwright/mcp` server to natively parse the Playwright trace. Validate locators against the live dev server natively.
- **Execution Workflow:** Ensure background tasks are running the explicit prerequisite targets (e.g., `npx nx run api:serve` and `npx nx run web-app-admin:serve`) before executing test commands natively in the terminal. All execution must be headless.

## Auth E2E Note
- Auth backend completion does not require expanding web E2E unless the user explicitly scopes that work. Auth library UT/IT and OpenAPI parity remain the backend branch gates.

## Subagent Orchestration
If a deterministic setup fails during E2E testing, deploy a `self` subagent to check the raw `postgres` MCP state to ensure the teardown mechanism from the previous run successfully cleared the data, while the main agent analyzes the Playwright trace.
