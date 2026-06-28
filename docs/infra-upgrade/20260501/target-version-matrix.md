# Target Version Matrix

Snapshot date: 2026-05-01.

The exact versions should be rechecked immediately before implementation. This matrix is the planning baseline.

## Runtime Baseline

| Package/tool | Current | Target | Rationale |
|---|---:|---:|---|
| Node.js | `.nvmrc` `20.19.1`, engine `>=18` | `24 LTS` preferred, `>=22 <25` transition allowed | Node production apps should use Active or Maintenance LTS. Angular 21 supports Node `^20.19.0 || ^22.12.0 || ^24.0.0`; Node 24 gives the longest runway. |
| npm | `10.8.2` | npm bundled with Node 24, or explicitly `>=10` | Avoid npm 9 baseline after Node runtime upgrade. |

Recommended final engine:

```json
{
  "engines": {
    "node": ">=24 <25",
    "npm": ">=10"
  }
}
```

Deadline-safe transition engine:

```json
{
  "engines": {
    "node": ">=22 <25",
    "npm": ">=10"
  }
}
```

## Nx And Build Tooling

| Package | Current | Target |
|---|---:|---:|
| `nx` | `21.3.11` | `23.0.1` |
| `@nx/workspace` | `21.3.11` | `23.0.1` |
| `@nx/angular` | `^21.3.11` | `23.0.1` |
| `@nx/js` | `21.4.1` | `23.0.1` |
| `@nx/node` | `21.3.11` | `23.0.1` |
| `@nx/nest` | `^21.4.1` | `23.0.1` |
| `@nx/eslint` | `21.3.11` | `23.0.1` |
| `@nx/eslint-plugin` | `21.3.11` | `23.0.1` |
| `@nx/webpack` | `21.3.11` | `23.0.1` |
| `@nx/vitest` | absent | `23.0.1` |
| `@nx/jest` | `21.3.11` | `23.0.1`, retained for backend/API/e2e only |

Nx migration metadata also moves TypeScript and SWC-related packages:

| Package | Target |
|---|---:|
| `typescript` | `~6.0.3` if compatible with generated migrations |
| `@swc/core` | `^1.15.5` or newer Nx-compatible |
| `@swc-node/register` | `^1.11.1` |
| `@swc/helpers` | `^0.5.18` |

Do not target TypeScript 6 while Angular 21 requires `<6.0.0`, but Angular 22 likely supports TS 6.0.

## Angular And Web Stack

Nx 23.0.1 migration metadata targets Angular 22.0.2, but we have intentionally locked Angular to `21.2.9`.

| Package | Current | Target |
|---|---:|---:|
| `@angular/*` runtime packages | `20.1.6` | `~21.2.9` |
| `@angular/material` | `20.1.5` | `~21.2.9` |
| `@angular/cdk` | `20.1.5` | `~21.2.9` |
| `@angular/build` | `^20.2.0` | `~21.2.9` |
| `@angular/ssr` | `^20.2.0` | `~21.2.9` |
| `@angular-devkit/core` | `20.1.5` | `~21.2.9` |
| `@angular-devkit/schematics` | `^20.2.0` | `~21.2.9` |
| `@schematics/angular` | `20.1.5` | `~21.2.9` |
| `ng-packagr` | `^20.2.0` | `~21.2.9` |
| `zone.js` | `0.15.1` | `~0.16.0` |
| `rxjs` | `7.8.1` | `7.8.2` or latest Angular-compatible `7.x` |
| `tslib` | `2.6.2` | `2.8.1` |

## Frontend Testing Target

Angular 21's official testing direction uses Vitest for new Angular CLI projects.

| Package | Current | Target |
|---|---:|---:|
| `vitest` | absent | `^4.1.9` minimum from Nx migration, current stable acceptable if compatible |
| `@vitest/coverage-v8` | absent | match Vitest major |
| `@vitest/ui` | absent | optional |
| `jsdom` | absent | `^27.1.0` from Nx migration, newer only after Angular/Vitest validation |
| `jest-preset-angular` | `^15.0.0` | remove after frontend migration; retain only until all web tests move |

Keep Jest for:

- `apps/api`
- `apps/e2e/api`
- `libs/server/**`
- backend-heavy shared tests until explicitly migrated

## ESLint And Formatting

| Package | Current | Target |
|---|---:|---:|
| `eslint` | `9.32.0` | `10.6.0` |
| `angular-eslint` | `^20.0.0` | `21.4.0` |
| `@typescript-eslint/*` | mixed `8.38.0` / `^8.29.0` | `^8.40.0` minimum from Nx migration; current `8.x` patch acceptable |
| `typescript-eslint` | `^8.29.0` | `^8.40.0` minimum; current `8.x` patch acceptable |
| `prettier` | `3.6.2` | `3.8.3` |

## Backend Runtime Dependencies

These are not fully managed by Nx and must be upgraded deliberately.

| Package | Current | Target | Notes |
|---|---:|---:|---|
| `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `@nestjs/testing` | `11.1.x` | `11.1.27` | Same major; low-to-medium risk |
| `@nestjs/swagger` | `11.2.0` | `11.4.4` | Re-run OpenAPI checks |
| `@nestjs/throttler` | `6.4.0` | `6.5.0` | Re-check 429 and `Retry-After` behavior |
| `@nestjs/config` | `4.0.2` | `4.0.4` | Same major |
| `@nestjs/schedule` | `6.0.0` | `6.1.x` | Same major |
| `@nestjs/terminus` | `11.0.0` | `11.1.x` | Same major |
| `prisma`, `@prisma/client` | `6.x` | `7.8.0` desired; `6.19.3` fallback | Prisma 7 is a major DB migration lane |
| `express` | `4.21.2` | Compatibility spike before Express 5 | Do not bump blindly |
| `helmet` | `7.1.0` | `8.2.0` | Re-check headers |
| `jsonwebtoken` | `9.0.2` | `9.0.3` | Patch |
| `bcryptjs` | `3.0.2` | `3.0.3` | Patch |
| `ioredis` | installed `5.8.1` | `5.10.1` | Same major |
| `@simplewebauthn/server` | `9.0.3` | `13.3.2` after dedicated auth regression | Security-sensitive major |
| `google-auth-library` | installed `9.15.1` | `10.6.2` after OAuth regression | Major |
| `class-validator` | `0.14.2` | `0.15.1` | Validate DTO behavior |
| `joi` | installed `17.13.3` | `18.1.2` after config validation checks | Major |
| `reflect-metadata` | `0.1.13` | `0.2.2` if Nest/Angular validation passes | Framework-sensitive |

## Client Runtime Dependencies

| Package | Current | Target | Notes |
|---|---:|---:|---|
| `@ngx-translate/core` | `16.0.4` | `18.0.0` | Major; validate i18n behavior |
| `@ngx-translate/http-loader` | `16.0.1` | `18.0.0` | Major |
| `chart.js` | `4.5.0` | `4.5.1` | Patch |
| `ng2-charts` | `8.0.0` | `10.0.0` | Major; migrate chart components |
| `tailwindcss` | `4.1.12` | `4.3.1` | Same major |
| `@tailwindcss/postcss` | `4.1.12` | `4.3.1` | Same major |

## API Contract Tooling

| Package | Current | Target |
|---|---:|---:|
| `@redocly/cli` | `2.7.0` | `2.35.1` |

Also update GitHub Actions Node setup from Node 18 to the chosen runtime baseline.

