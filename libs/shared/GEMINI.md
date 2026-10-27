# Antigravity Guidelines: Shared Libraries (`libs/shared`)

## Purpose
`libs/shared` contains pure, framework-agnostic TypeScript used by both server and client.

Good candidates:
- Shared types.
- Shared enums/string literal unions.
- Pure validators.
- Pure utilities.
- Isomorphic DTO contracts that are truly shared.
- Shared message/error key constants.

## Restrictions
- No Angular imports.
- No NestJS imports.
- Avoid Node-only APIs such as `fs`, `path`, and `crypto` unless browser-safe fallbacks exist and are guarded.
- No runtime side effects.
- Keep code tree-shakable and bundler-friendly.
- Keep exported data JSON-serializable where practical.

## Models And Serialization
- Do not put persistence entities in shared.
- Do not put server-only DTOs in shared.
- Prefer plain objects and literal unions.
- Use ISO strings for dates crossing server/client boundaries.
- Use strings for money/decimal API values.
- Document optional versus `null` semantics.

## Testing & Execution Protocol
- Unit tests are colocated under `src/**/*.spec.ts`.
- Tests should be fast, deterministic, and framework-free.
- **Antigravity Workflow:** Execute tests natively using `npx nx test [shared-project-name]`. Do not use DevTools or database MCPs when modifying code in `libs/shared`; treat this layer as strictly pure TypeScript logic.
