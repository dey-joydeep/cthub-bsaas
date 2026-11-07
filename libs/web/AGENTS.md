# Web Guidelines

Read this file before working under `libs/web/**`.

## Stack

- Angular 22.
- Standalone components for new code.
- SSR enabled.
- Angular Material v3.
- Tailwind v4.

## Architecture

- `libs/web/config`: web-only environment/config tokens and helpers.
- `libs/web/core/*`: shared web capabilities such as auth, HTTP, testing.
- `libs/web/*/auth`: app-specific Auth UX and models for Admin, Partner, and Customer.
- `libs/web/ui`: shared design system components.

## Import Hygiene

- Web libs must not import from server libs.
- Allowed cross-area imports: `libs/web/*` and `libs/shared/*`.
- Import from package roots or configured path aliases.
- Do not deep-import across packages with relative paths.
- Keep shared UI in `libs/web/ui`; do not duplicate app-specific copies.

## SSR Safety

- Do not access browser globals at top level.
- Guard `window`, `document`, `localStorage`, `ResizeObserver`, `navigator`, and WebAuthn APIs.
- Use `inject(PLATFORM_ID)` and `isPlatformBrowser()` for browser-only behavior.
- Defer DOM access to browser-safe lifecycle hooks.
- Prefer Angular abstractions that work in SSR, such as `HttpClient`, `TransferState`, and CDK utilities.
- Use relative API URLs unless a server-side proxy/config requires otherwise.

## Internationalization (i18n)

- Standard mechanism: use native Angular compile-time i18n (`@angular/localize` and `$localize`). Do not install or import legacy `@ngx-translate` runtime modules or pipes (`| translate`).
- Template localization: use standard `i18n="@@KEY_ID"` attributes on HTML elements or `<ng-container i18n="@@KEY_ID">Text</ng-container>` for unwrapped text nodes.
- Attribute localization: when localizing element attributes (`matTooltip`, `placeholder`, `aria-label`, `title`), always use the `i18n-attributeName="@@KEY_ID"` syntax (e.g., `<button matTooltip="Refresh" i18n-matTooltip="@@COMMON.REFRESH">`). Never place `<ng-container>` or other HTML tags inside attribute quotes.
- TypeScript localization: use native tagged template literals: `$localize`:@@KEY_ID:Default English String``.
- Testing: do not provide or mock `TranslateService`, `MockTranslateService`, or `TranslateModule` in `TestBed`. Native `$localize` tokens fall back directly to their inline English default string in unit tests; assert against the English string directly.

## Client Models And APIs

- Any object parameter or object return must use a named interface/type/model/DTO.
- Prefer readonly UI models.
- Keep state JSON-serializable for SSR and hydration.
- Store dates as ISO strings in persisted or transferred state.
- Use discriminated unions with a stable `kind` or `type` field for variants.

## UI And Accessibility

- Match existing app/design-system patterns.
- Use Angular Material and local UI components where available.
- Avoid marketing-style layouts for operational SaaS surfaces.
- Ensure text does not overflow or overlap on mobile/desktop.
- Inputs need labels and accessible error descriptions.
- Use keyboard-friendly controls and visible focus states.

## Testing

- Unit tests live under `src/**/*.spec.ts`.
- Keep tests shallow and deterministic.
- Use Angular-compatible test utilities.
- Integration-style web service tests may live under `tests/integration/**/*.it-spec.ts` when meaningful and configured.
- E2E belongs under app-level projects in `apps/e2e/**`.
- For visible changes, inspect the affected route when an app can run. Check console errors, hydration, responsive layout, keyboard access, and changed states; preserve browser evidence for QA.
- When implementing an existing design, use its source or checked-in spec. Report an unavailable design source rather than guessing precise tokens.

## Dev Tooling And Mock Isolation

- Never compile or activate dev-only mock interceptors, debug tools, or bypass utilities in production builds.
- User-controlled inputs (`URLSearchParams`, `localStorage`, request headers, cookies) must NEVER be used to activate mock data, debug logging, or role bypasses in production.
- The check `if (environment.production) return false;` must always be the very first line of defense in any dev utility, before checking any query parameters or storage.
- Dev-only interceptors and test providers must be conditionally registered in `withInterceptors` or `providers` using `!environment.production ? [devInterceptor] : []`. They must never be registered unconditionally in production pipelines.
- Every dev-only mock or debug utility must include an automated negative unit test proving it strictly evaluates to `false` when `environment.production === true`.
