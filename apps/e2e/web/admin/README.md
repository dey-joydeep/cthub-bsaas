Web Admin E2E (scaffold)

- Purpose: end-to-end tests for the Admin web app using Playwright or Cypress.
- Status: not implemented yet. Structure and Nx project are ready.
- Suggested next steps:
  - Add Playwright config (playwright.config.ts) and fixtures under src/.
  - Wire `e2e` target to `@nx/playwright:playwright` with `devServerTarget: web-admin:serve`.

