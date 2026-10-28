# AIDD Task Prompt: Workspace Adoption of Nx 24 & Angular 22 Infrastructure Upgrade

```text
Follow the repository AIDD workflow. This is a new trackable engineering task.

Goal:
Execute full workspace adoption of the Nx 24, Angular 22, and TypeScript 6 infrastructure upgrade across existing frontend libraries, backend skeletons, test suites, and E2E setups (Phase 2 of the upgrade cycle).

Context & References:
- Root rules: AGENTS.md, GEMINI.md, and .agents/AGENTS.md
- Process guide: docs/aidd/README.md and docs/aidd/playbooks/new-task-flow.md
- Infrastructure Baseline: docs/infra-upgrade/next-cycle-memo.md
- Migration Report: docs/infra-upgrade/20261026-nx24-angular22/migration-report.md
- Slicing Strategy: docs/specs/project-wide/IMPLEMENTATION/implementation-slicing.md

Mandatory First Step:
Before writing code or editing files, invoke the `aidd-project-tracker` skill to create the GitHub Epic and sub-issues on project board projects/1 using `.agents/skills/aidd-project-tracker/scripts/init-tracker.ps1`.
- Epic Title: [CHORE] Full Workspace Adoption of Nx 24 & Angular 22 Infrastructure Upgrade
- Sub-Issues:
  1. Phase 1: Frontend Type-Check & Import Remediation (Expand tsconfig.lib.json)
  2. Phase 2: Angular 22 Signals & Modern Reactivity Refactor
  3. Phase 3: Vitest Spec Modernization & Jest Global Cleanup
  4. Phase 4: Playwright E2E SSR Hydration Smoke Tests
  5. Phase 5: Backend Feature Skeletons Type-Check Health & Monorepo Verification

Scope of Work:
1. Phase 1: Frontend Type-Check & Import Remediation
   - Resolve broken relative model imports (e.g., `../../models/*`) across `libs/web/customer`, `libs/web/partner`, and `libs/web/admin`.
   - Expand `tsconfig.lib.json` in all web libraries to `include: ["src/**/*.ts"]` (removing the artificial scope restriction that previously isolated non-auth folders).
   - Verify `npx nx run-many -t type-check --projects=tag:platform:web` passes cleanly under TypeScript 6.0.3 with 0 errors.

2. Phase 2: Angular 22 Signals & Modern Reactivity Refactor
   - Refactor active components (including Auth components in `libs/web/*/src/lib/features/auth` and core dashboard widgets) from legacy patterns (getter state, `@Input()` decorators, constructor DI, manual RxJS subscriptions) to modern Angular 22 reactive primitives:
     - `signal()`, `computed()`, `input()`, `output()`, and `inject()`.
   - Verify that `ChangeDetectionStrategy.OnPush` remains active and operates smoothly with signal notifications.

3. Phase 3: Vitest Spec Modernization & Runner Cleanup
   - Standardize all unit tests in `libs/web/*` (e.g., `libs/web/partner`) to native Vitest syntax, removing legacy Jest/Jasmine globals (`vi` namespace mismatches, `fail()`).
   - Verify that `npx nx run-many -t test --projects=tag:platform:web` runs with 100% green test suites and 0 runner warnings.

4. Phase 4: Playwright E2E SSR Hydration Smoke Tests
   - Replace placeholder files (`apps/e2e/web/{customer,partner,admin}/src/lint-placeholder.ts`) with authentic Playwright smoke tests that verify:
     - Server-side rendering (SSR) startup and valid HTML delivery.
     - Client-side Angular 22 hydration without error.
     - Basic route navigation and auth redirection under `web-core-auth`.

5. Phase 5: Backend Skeletons Type-Check Health & Monorepo Verification
   - Align legacy imports in `libs/server/features/` (`appointment`, `dashboard`, `portfolio`, `review`, `salon`, `salon-staff-request`, `social`, `theme`, `user`) against current `@cthub-bsaas/server-core` and Prisma types, or prune unneeded legacy artifacts.
   - Run the full workspace validation gates:
     - `npx nx run-many -t type-check` (0 errors)
     - `npx nx run-many -t lint` (0 errors, report warnings)
     - `npx nx run-many -t test` (100% passing)
     - `npx nx run-many -t build` (apps and buildable libs compile cleanly)

Mandatory Constraints:
- Terminal Execution: Always use PowerShell 7 (`pwsh`). Prefix terminal commands with `pwsh -c` or `pwsh -Command "..."`.
- Zero Legacy Peer Deps: Never run `npm install --legacy-peer-deps` or `--force`.
- Git Discipline: Do not commit without explicit instruction from the user. Work in a dedicated isolation branch (`chore/workspace-infra-adoption`).
- Post-Edit Ast Validation: After modifying or creating any code or test files, run:
    npx prettier --write <touched-files>
    npx eslint --fix <touched-files>
  and explicitly report any warnings or non-fatal lint issues to the user.

Completion Output Format:
Produce a completion summary containing:
- Summary of changes by phase
- Files changed / created / pruned
- Validation commands run and their exact outcomes
- Project tracker board status and closed sub-issues
```
