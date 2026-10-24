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

## 2. Backend Framework & Test Runner Strategy (NestJS v11 Jest vs. NestJS v12 Vitest)

### Current Landscape: NestJS 12 Release & Tooling Shift

The NestJS ecosystem has transitioned to **NestJS 12 (latest: `@nestjs/core@12.2.0`)**, with the `11.x` line entering legacy maintenance (`11.2.8`). NestJS 12 introduces several fundamental architectural changes:

1. **Native Vitest as Default Runner:** For newly scaffolded ESM projects, the NestJS CLI has officially replaced Jest with **Vitest** out-of-the-box (paired with `oxlint` for linting).
2. **Strict Pure ESM Packaging:** Core framework packages (`@nestjs/core`, `@nestjs/testing`, `@nestjs/common`) are published **strictly as pure ESM**.
3. **Compiler Modernization:** NestJS 12 deprecates its legacy Webpack compiler in favor of **Rspack** and native Vite/Rollup pipelines.
4. **Jest Incompatibility in v12:** Because Jest uses its own proprietary module loader rather than Node's native ESM resolution, running Jest against NestJS 12 pure ESM packages causes `Must use import to load ES Module` errors unless executed on Node 24.9+ with the `--experimental-vm-modules` flag.

### Architectural Decision: Defer NestJS 12; Retain NestJS 11 + Jest Baseline

While NestJS 12 is stable, **upgrading to NestJS 12 and migrating backend tests to Vitest are formally deferred** for our workspace:

- **Why NestJS 12 is Deferred in This Cycle:**
  1. **Upstream Nx Peer Dependency Blocker:** Verified that `@nx/nest` (even in the latest Nx `24.0.1`) explicitly caps its peer dependency range:
     ```json
     {
       "@nestjs/core": ">=10.0.0 <12.0.0",
       "@nestjs/common": ">=10.0.0 <12.0.0"
     }
     ```
     Installing NestJS 12 alongside `@nx/nest` triggers `ERESOLVE` peer dependency conflicts under standard npm.
  2. **Bundler & Generator Mismatch:** The current `@nx/nest:application` generator still hardcodes Webpack build targets and CommonJS module wrapping. It does not yet supply the Rspack compiler and pure ESM generator schemas required by NestJS 12.
  3. **Preserving Bedrock Ground Truth:** Our single implemented domain feature (`server-feature-auth`) has achieved **100% statement, branch, function, and line test coverage** (172 unit tests, 158 integration tests) and **100% OpenAPI schema parity** on NestJS `11.1.27` with `@swc/jest`. Forcing an upgrade now would introduce experimental VM flags and destabilize our only fully verified business domain logic.
- **Express 5 Alignment:** While Express 5 (`5.3.0`) is supported in `@nx/express`, NestJS 11 remains optimized around Express 4 (`4.21.2`). The Express 5 upgrade will be tackled concurrently with the NestJS 12 upgrade.
- **Roadmap & Trigger for Next Cycle:**
  - **Trigger:** Upstream release of official NestJS 12 support in `@nx/nest` with native Rspack and pure ESM generators.
  - **Action:** Execute the NestJS 12 and backend Vitest migrations simultaneously via automated Nx migration generators once supported without flags.

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

## 4. Angular 22 & Nx 24 Upgrade Strategy

### Current Status

- **Nx:** Our workspace is stable on **Nx `23.0.1`**. Nx `24.0.1` is released.
- **Angular:** Our workspace is on **Angular `21.2.9`**. Angular `22.2.3` is released.
- **Nx Support:** `@nx/angular@24.0.1` peer dependencies declare support for Angular 20 through 22 (`>=20.0.0 <23.0.0`).

### Architectural Recommendation: Dedicated Isolation Branch

Unlike NestJS 12 (which is blocked by upstream peer dependencies), upgrading to **Nx 24** and **Angular 22** is technically possible without package manager conflicts. However:

1. **Do Not Mix into Current Branch (`chore/infra-upgrade`):**
   - Nx 24 removes explicit executors (`@nx/jest:jest`, `@nx/eslint:lint`), requiring all 39 projects to convert to inferred plugins.
   - Angular 22 introduces component API and theme token shifts across Angular Material, touching all 3 frontend apps and 8 frontend libraries (where business features remain scaffolds/stubs except login).
2. **Execute in a Dedicated Lane:**
   - Merge `chore/infra-upgrade` to establish the clean, green NestJS 11 + Angular 21 + Nx 23 baseline.
   - Create a fresh branch (`chore/nx24-angular22-upgrade`) to execute `npx nx migrate 24.0.1` and `@angular/core@22`, verifying frontend hydration, SSR, and Material styling in isolation.
