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
- Avoid marketing-style layouts for operational SaaS surfaces. Operational consoles, master-detail workspaces, and catalog screens must use fluid or high-ceiling responsive containers (`max-width: 1680px` or `100%` with `padding: 1.25rem 2rem`), never narrow centered marketing boxes (`max-width: 1200px`) that leave dead gutters (>20% of desktop viewport).
- Avoid compounding multi-column grids (e.g., 2-column cards holding 2-column forms). Maintain minimum readable widths: `datetime-local` pickers, select dropdowns, and date-range controls require $\ge 220\text{px}$ minimum to prevent truncation of placeholders (`dd/mm/yyyy --:--`).
- Master sidebars must maintain $320\text{px}$–$380\text{px}$ width with comfortable vertical rhythm and prevent tight text wrapping on cards.
- **Vertical Viewport Budget & The Above-the-Fold Law**: Operational and master-detail workspaces must prioritize vertical real estate. Standard desktop viewports have only $\sim 750\text{px} - 800\text{px}$ of usable vertical height. The combined vertical height of all headers, banners, and tab bars must not exceed $120\text{px}$. Operational views must never display marketing-style hero banners or redundant explanatory paragraphs. The primary interactive working surface (search, filter, list items, first form card) must be visible above the fold on desktop viewports without scrolling.
- **Action Deduplication & Single-Source Placement**: Primary action buttons must have a single logical home. Never duplicate identical creation buttons across page banners and child workspace toolbars (e.g. `+ Staff` in page header vs `+ Add Staff Member` in the sidebar). Context-specific actions must belong to their active tab or list toolbar, never displayed globally across unrelated tabs.
- **Micro-Alignment & Typography/Icon Baseline Invariants**: Any container pairing an icon with text (navigation links, buttons, chips, metadata rows) must strictly use `display: inline-flex; align-items: center; gap: 0.5rem;` (or Tailwind `inline-flex items-center gap-2`). Icons must declare explicit matching dimensions (`font-size: 1.25rem; width: 1.25rem; height: 1.25rem; flex-shrink: 0; line-height: 1;`) to eliminate baseline drift and staggered floating.
- Ensure text does not overflow or overlap on mobile/desktop.
- Inputs need labels and accessible error descriptions.
- **3-Tier Form Error Architecture (ADR-0006)**:
  - _Tier 1 (Client Validation)_: Controls declaring validators (`Validators.required`, `Validators.pattern`, `Validators.minLength`, or HTML `required`) **must** include matching `<mat-error>` elements in HTML. Unvalidated optional fields (e.g. notes, search inputs) do not require `<mat-error>`. On invalid form submission, handlers must invoke `form.markAllAsTouched()` AND set `this.error.set('Please correct the highlighted fields before saving.')`.
  - _Tier 2 (Field-Level Server Errors)_: HTTP 422 `{ field, message }` responses must be mapped to controls using `applyServerValidationErrors(form, error)` from `@cthub-bsaas/web-core-common`, rendering dynamically via `<mat-error>{{ control.getError('serverError') }}</mat-error>`.
  - _Tier 3 (Domain / State Conflicts)_: HTTP 409 / 403 cross-entity conflicts (e.g. last owner protection, overlapping bookings) render in the accessible top alert banner (`role="alert"`), preserving the user's draft form inputs.
- Use keyboard-friendly controls and visible focus states.

## Testing

- Unit tests live under `src/**/*.spec.ts`.
- Keep tests shallow and deterministic.
- Use Angular-compatible test utilities.
- **Mandatory Negative DOM Tests (ADR-0006)**: Every component managing a `FormGroup` must contain automated negative unit tests in its `*.spec.ts` asserting that submitting an invalid form renders `<mat-error>` in the DOM, renders the accessible `.salon-banner-error` alert, and does not invoke the API save method.
- **Prohibition of `TestBed.overrideComponent` (ADR-0006 & Angular Issue #30127)**: Never use `TestBed.overrideComponent()` in unit tests. Overriding component metadata strips AOT compiler metadata and breaks source-mapping for template code coverage. Mock dependencies via clean Angular DI providers (`{ provide: Service, useValue: mock }`) or standalone dummy imports instead.
- Run `npm run aidd:form-validation` to mechanically audit form templates and spec files across the workspace.
- Integration-style web service tests may live under `tests/integration/**/*.it-spec.ts` when meaningful and configured.
- E2E belongs under app-level projects in `apps/e2e/**`.
- For visible changes, inspect the affected route when an app can run. Check console errors, hydration, responsive layout, keyboard access, and changed states; preserve browser evidence for QA.
- **Visual Verification Requirement**: Inspecting the text-only Accessibility Tree or DOM nodes (`take_snapshot`) does NOT substitute for visual verification. Agents must actively review captured rendered screenshots (`take_screenshot`) against the **5-Point Visual Heuristic Audit Checklist** before declaring any UI task complete:
  1. _Vertical Viewport & Fold_: Is the primary working surface (master list, form, table) visible above the fold on desktop without scrolling? Is the combined header stack $\le 120\text{px}$?
  2. _Action Deduplication_: Does every primary action have a single logical home without redundant copies in parent banners and child toolbars?
  3. _Micro-Alignment_: Are all icon-text pairings baseline-centered with `inline-flex items-center` and matching icon bounding boxes?
  4. _Negative Space & Canvas_: Are horizontal and vertical dead gutters eliminated while preserving readable control widths ($\ge 220\text{px}$)?
  5. _Contextual Scoping_: Are all visible actions and navigation elements scoped strictly to the active persona and active tab?
- When implementing an existing design, use its source or checked-in spec. Report an unavailable design source rather than guessing precise tokens.

## Dev Tooling And Mock Isolation

- Never compile or activate dev-only mock interceptors, debug tools, or bypass utilities in production builds.
- User-controlled inputs (`URLSearchParams`, `localStorage`, request headers, cookies) must NEVER be used to activate mock data, debug logging, or role bypasses in production.
- The check `if (environment.production) return false;` must always be the very first line of defense in any dev utility, before checking any query parameters or storage.
- Dev-only interceptors and test providers must be conditionally registered in `withInterceptors` or `providers` using `!environment.production ? [devInterceptor] : []`. They must never be registered unconditionally in production pipelines.
- Every dev-only mock or debug utility must include an automated negative unit test proving it strictly evaluates to `false` when `environment.production === true`.
