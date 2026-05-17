# Web Codex Instructions

These instructions apply under `libs/web`.

## Scope

- `config`: web configuration, environments, styles, tokens, types, and utilities.
- `core/*`: shared web capabilities such as auth, HTTP, platform, common utilities, and testing.
- `ui`: shared UI and design-system components.
- `admin`, `partner`, `customer`: persona-specific web features.
- `public`: public web experience where present.

## Rules

- Follow existing Angular 20 patterns.
- Prefer standalone components for new code unless a local pattern requires otherwise.
- Keep code SSR-safe and guard browser-only APIs.
- Do not place app-specific logic in shared UI or core libraries.
- Do not duplicate auth or HTTP infrastructure across persona apps.
- Use Angular Material v3 and the existing SCSS plus Tailwind approach.
- Tailwind utilities must use the `twc-` prefix.
- Do not introduce unprefixed Tailwind utility classes.
- Do not re-enable Tailwind preflight unless explicitly requested.
- Use named interfaces, types, or models for public service and component APIs.
- Supported locales are `en`, `bn`, and `hi`.

## Testing

- Add or update component and service tests when behavior changes.
- Keep tests deterministic and SSR-aware.
- Do not weaken test coverage or skip failing tests.

## Targeted validation examples

```powershell
npx nx test web-core-auth
npx nx test web-core-http
npx nx test web-ui
npx nx test web-lib-admin
npx nx test web-lib-partner
npx nx test web-lib-customer
npx nx lint web-app-admin
npx nx build web-app-admin
```
