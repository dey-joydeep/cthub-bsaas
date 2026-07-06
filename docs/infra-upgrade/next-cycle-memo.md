# Next Upgrade Cycle Memo — Architectural Decisions & Housekeeping

_This document serves as an authoritative architectural memo and forward-looking roadmap for the next infrastructure upgrade cycle (following the completion of the `20260501` upgrade cycle). It captures key architectural decisions, deferred migrations, and preparatory housekeeping items for **Nx**, **Angular**, **NestJS**, and **Prisma**._

---

## 1. Database ORM Strategy (Prisma vs. Raw SQL / Query Builders)

### Architectural Decision: Retain Prisma ORM as the Primary Standard

There is an adage from the Java/Hibernate ecosystem: _"If an application handles queries more complex than basic CRUD, avoid using stateful ORMs."_ While true for stateful ORMs like Hibernate/JPA (which suffer from Persistence Context memory overhead, dirty checking, and `LazyInitializationException` traps), **it does not apply to Prisma.**

- **Why Prisma Remains Our Standard:** Prisma is a **100% stateless data mapper and query builder**. It maintains no identity map or first-level cache, never throws lazy loading exceptions, and returns plain JavaScript/TypeScript objects (POJOs). Its compile-time type safety via schema-derived interfaces is unmatched for 85–90% of our domain operations (CRUD, nested relations, transactional scopes, and pagination).
- **Mandate for Complex Queries (10–15% of workloads):** For ultra-complex reporting, analytical aggregations, window functions, or multi-table Common Table Expressions (CTEs), **do not abandon Prisma or introduce second ORMs.** Instead:
  1. Use Prisma's native SQL escape hatches: **`$queryRaw`** and **`TypedSql`** (parameterized, SQL-injection-safe raw queries mapped to typed DTOs).
  2. Leverage our **Hexagonal Architecture (Ports & Adapters)** boundary. Feature logic depends strictly on repository interfaces (`libs/server/contracts-*`). If an endpoint requires specialized SQL, implement it inside the concrete infrastructure adapter (`libs/server/infrastructure`) without polluting business logic.

---

## 2. Backend Test Runner Strategy (NestJS v11 Jest vs. NestJS v12 Vitest)

### Architectural Decision: Preserve Backend Jest Now; Migrate to Vitest in NestJS v12

During the `20260501` cycle, 100% of frontend web projects (`apps/web/*`, `libs/web/*`) were migrated to Vitest. However, backend projects (`apps/api`, `libs/server/*`, `apps/e2e/api`) were intentionally kept on **Jest (`@swc/jest` `"0.2.39"`)**.

- **Why We Stayed on Jest for NestJS v11:**
  1. **Bedrock Safety Net:** Maintaining our established 100% test coverage suites on Jest without modification gave us an untouched ground truth while modernizing core backend dependencies in Phase 7.
  2. **Zero Speed Premium:** Our backend Jest setup is powered by Rust-based `@swc/jest`, already executing at native C++ compilation speeds.
  3. **DI Decorator Nuances in v11:** Standard Vitest (`esbuild`) strips TypeScript types without emitting metadata required for NestJS Dependency Injection (`@Injectable()`, `@Controller()`). Running Vitest on NestJS v11 requires manual wiring of `unplugin-swc` and `vite-tsconfig-paths`, along with refactoring hundreds of `mockDeep()` and `jest.mock()` calls.
- **Roadmap for Next Cycle (NestJS v12):**
  - **Target:** NestJS v12 (targeted for early Q3 2026 release) makes **Vitest the native zero-config default test runner**, replacing Jest out-of-the-box.
  - **Action:** When upgrading to NestJS v12, execute the backend Vitest migration using official `@nestjs/schematics` and `@nx/nest` automated migration generators. This allows us to adopt native Vitest without writing manual SWC DI decorator workarounds.

---

## 3. Nx Monorepo Housekeeping (Preparing for Nx v24)

During testing in Nx v23, several informational deprecation notices were emitted regarding plugins and executors that will be removed in **Nx v24**. Address these items prior to or during the Nx v24 upgrade:

### A. Frontend Vite Configuration (`vite.config.mts`)

- **`nxViteTsPaths` Plugin:** Deprecated in `@nx/vite/plugins/nx-tsconfig-paths.plugin`.
  - **Action:** Replace with `tsconfigPaths()` from the standard `vite-tsconfig-paths` package across all frontend project vite configs.
- **`nxCopyAssetsPlugin` Plugin:** Deprecated in `@nx/vite/plugins/nx-copy-assets.plugin`.
  - **Action:** Replace with Vite's native `publicDir` option or the `vite-plugin-static-copy` package.

### B. Backend Jest Configuration (`project.json` / inferred targets)

- **`@nx/jest:jest` Executor:** The explicit `@nx/jest:jest` executor is deprecated in favor of `@nx/jest/plugin` inferred targets.
  - **Action:** Run `nx g @nx/jest:convert-to-inferred` across backend test projects to migrate to inferred targets before Nx v24.

---

## 4. Angular 22 Upgrade (Deferred Phase 3)

### Current Standing & Trigger

During the `20260501` cycle, Phase 3 (upgrading `@angular/*`, `@angular/material`, and `@angular/cdk` from `~21.2.9` to `~22.0.2`) was deferred as out of scope pending official `@nx/angular` v22 migration support.

- **Action for Next Cycle:** Check for official `@nx/angular` v22+ compatibility. Once confirmed, run `npx nx migrate @nx/angular@latest` (or target v22 major) to execute the Angular framework upgrade cleanly.
