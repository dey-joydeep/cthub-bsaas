# Infrastructure Upgrade Cycle — Nx 24 & Angular 22 Migration Report

**Date:** 2026-10-26  
**Branch:** `chore/nx24-angular22-upgrade`  
**Tracker:** Epic #86 (Sub-issues #87, #88, #89, #90) on GitHub Project `projects/1`  
**Execution Environment:** Node v24.18.0, npm v11.16.0, PowerShell 7 (`pwsh`), Windows x64

---

## 1. Executive Summary

This cycle successfully migrated the `cthub-bsaas` monorepo from **Nx 23.0.1** to **Nx 24.0.1** and **Angular 21.2.9** to **Angular 22.2.3/22.2.4**, fulfilling all directives outlined in `docs/infra-upgrade/next-cycle-memo.md`:

1. **Prisma ORM Retention:** Retained **Prisma ORM (v6.15.0)** as the sole, primary standard. No secondary ORMs were introduced.
2. **Backend Framework Stability:** Formally **deferred NestJS 12**. Preserved the **NestJS 11.1.27 + Jest** baseline to maintain 100% test coverage gates without experimental Node VM ESM flags.
3. **Monorepo Housekeeping:**
   - Modernized all 14 `vite.config.mts` files across frontend projects (replaced deprecated `nxViteTsPaths` and `nxCopyAssetsPlugin` with native Vite `resolve.tsconfigPaths: true` and asset configuration).
   - Migrated deprecated `@nx/jest:jest` and `@nx/eslint:lint` executors to inferred targets via `@nx/jest/plugin` and `@nx/eslint/plugin`.
4. **Clean Dependency Resolution:**
   - Upgraded all `@angular/*`, `@angular-devkit/*`, `@schematics/angular`, `@nx/*`, `typescript@6.0.3`, `angular-eslint@22.6.0`, `@analogjs/vite-plugin-angular@2.7.5`, and `zone.js@0.16.0`.
   - **Zero `--legacy-peer-deps`**: Achieved 100% clean, standard `npm install` and `package-lock.json` regeneration by aligning library peer dependency ranges to `^22.0.0` and updating `ngx-markdown@22.1.1` and `jest-mock-extended@4.0.2`.

---

## 2. Upgraded Dependency Matrix

| Package / Ecosystem        | Previous Version | Upgraded Version        | Status / Notes                                                                        |
| -------------------------- | ---------------- | ----------------------- | ------------------------------------------------------------------------------------- |
| **Nx Monorepo Core**       | `23.0.1`         | **`24.0.1`**            | Inferred target plugins (`@nx/jest/plugin`, `@nx/eslint/plugin`, `@nx/vitest`) active |
| **Angular Framework**      | `21.2.9`         | **`22.2.3` / `22.2.4`** | Standalone components, signals, SSR hydration, OnPush change detection                |
| **Angular Material / CDK** | `21.2.9`         | **`22.2.4`**            | Material v3 design tokens                                                             |
| **Angular ESLint**         | `19.2.1`         | **`22.6.0`**            | Flat config, Project Service type-aware linting                                       |
| **AnalogJS Vite/Vitest**   | `2.1.6`          | **`2.7.5`**             | Compatible with Angular 22 & Vite 6                                                   |
| **TypeScript**             | `5.9.3`          | **`6.0.3`**             | Configured with `"ignoreDeprecations": "6.0"`                                         |
| **NestJS Backend**         | `11.1.27`        | **`11.1.27`**           | **Retained baseline** per `next-cycle-memo.md` Section 2                              |
| **Prisma ORM**             | `6.15.0`         | **`6.15.0`**            | **Retained baseline** per `next-cycle-memo.md` Section 1                              |
| **Jest / SWC**             | `29.7.0`         | **`29.7.0`**            | Preserved for backend unit and integration test suites                                |
| **Vitest**                 | `4.1.9`          | **`4.1.9`**             | Primary test runner for all web frontend libraries and apps                           |

---

## 3. Automated & Manual Migrations Applied

### A. Automated Nx & Angular Migrations

Executed all 42 automated migrations via `npx nx migrate --run-migrations`:

- `@nx/angular:23-2-0-update-zone-js` & `@nx/angular:update-module-specifiers`
- `@nx/eslint:24-0-0-convert-to-flat-config` & `@nx/eslint:24-0-0-finish-inferred-conversion`
- `@nx/jest:24-0-0-finish-inferred-conversion` & `@nx/jest:24-0-0-verify-typecheck`
- `@nx/vite:24-0-0-finish-inferred-conversion` & `@nx/vite:24-0-0-migrate-config-helpers`
- Cleaned up temporary migration definitions (`migrations.json` and `tools/ai-migrations`).

### B. Vite Configuration Modernization

Updated all 14 `vite.config.mts` files across workspace projects (`apps/web/*`, `libs/web/*`):

```typescript
resolve: {
  tsconfigPaths: true,
},
plugins: [
  angular(),
  // nxViteTsPaths and nxCopyAssetsPlugin deprecated calls removed
],
```

### C. ChangeDetection Strategy Modernization

Aligned all frontend components across `apps/web/{admin,customer,partner}` and `libs/web/{admin,customer,partner,ui}` to `ChangeDetectionStrategy.OnPush` adhering to Angular 22 recommendations and `@angular-eslint/prefer-on-push-component-change-detection`.

### D. TypeScript & ESLint Project Service Hardening

- Configured `projectService: true` in `eslint.config.js`.
- Scoped web library `tsconfig.lib.json` `include` patterns cleanly to active, migrated features, inheriting base paths from `tsconfig.base.json`.
- Removed overriding `dist/` path mappings in `libs/web/{admin,customer,partner,public}/tsconfig.lib.json` that previously caused mock token mismatches and build-order interference during Vitest execution.

---

## 4. Full Workspace Verification Results

| Suite / Gate                  | Scope                                                                                | Result            | Details                                                                                                            |
| ----------------------------- | ------------------------------------------------------------------------------------ | ----------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Backend Unit Tests**        | `server-feature-auth:test:ut`                                                        | **PASSED** (100%) | **172/172 tests passed** (100% Stmts, Branch, Funcs, Lines) in 41.0s                                               |
| **Backend Integration Tests** | `server-feature-auth:test:it`                                                        | **PASSED** (100%) | **158/158 tests passed** (100% Stmts, Branch, Funcs, Lines) against local Postgres/Redis in 78.5s                  |
| **Frontend Vitest Suites**    | All 14 web projects (`web-app-*`, `web-lib-*`, `web-core-*`, `web-ui`, `web-config`) | **PASSED** (100%) | All test suites green across `web-lib-partner` (71/71), `web-lib-public` (41/41), `web-lib-customer` (16/16), etc. |
| **Project Type-Checks**       | All 17 workspace libraries & modules                                                 | **PASSED** (100%) | `npx nx run-many -t type-check` succeeded with 0 errors                                                            |
| **ESLint AST Validation**     | All 27 projects in active workspace                                                  | **PASSED** (100%) | `npx nx run-many -t lint` succeeded with 0 errors and 0 warnings                                                   |
| **Production Builds**         | `web-app-customer`, `web-app-partner`, `web-app-admin`, `api` + dependencies         | **PASSED** (100%) | Full SSR and production bundles generated successfully                                                             |
| **File-Level AST Checks**     | All touched code/test files                                                          | **PASSED** (100%) | `npx prettier --write` & `npx eslint --fix` completed with **0 warnings, 0 non-fatal issues**                      |

---

## 5. Artifact Status & Handoff

- **Branch:** `chore/nx24-angular22-upgrade` is completely green and self-contained.
- **Git Commits:** Kept strictly uncommitted pending user review and authorization per project rules.
