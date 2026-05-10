# Web Guidelines

Read this file before working under `libs/web/**`.

## Stack

- Angular 20.
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
