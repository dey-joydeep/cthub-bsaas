# Web Guidelines

Read this file before working under `libs/web/**` or on client-facing applications (`apps/web/**`).

## Core Architecture & Quality Standard

All frontend development, component architecture, forms, layouts, i18n, accessibility, and testing MUST strictly adhere to:  
👉 **[Frontend Development Principles and Architecture Standards](../../docs/quality-standards/frontend-development-principles.md)**

Key Pillars defined in the standard:

1. **Multi-Locale Architecture**: Day-1 mandatory i18n key tagging (`i18n="@@..."`, `$localize`). Zero bare string literals in templates or code.
2. **Enterprise 3-Tier Form Validation (ADR-0006)**: `<mat-error>` on validated controls, HTTP 422 mapping, HTTP 409 conflict banners, phone format validation (`phoneNumberValidator`), and viewport auto-scrolling (`scrollToFirstInvalidControl` + `MatSnackBar`).
3. **Operational Viewport & Above-the-Fold Law**: $\le 120\text{px}$ combined header stack, action deduplication, micro-alignment invariants.
4. **WCAG 2.1 AA Accessibility**: $\ge 4.5:1$ color contrast across all states, accessible button names, no double-asterisks.
5. **High-Fidelity Testing**: Mandatory negative DOM tests, strict ban on `TestBed.overrideComponent` (Angular CLI #30127).
6. **Screen Ergonomics & Responsive Invariants**: Mandatory zero-data empty state with primary CTA, fluid containers with responsive collapse (<1024px into drawers/slide-overs), sticky header offset (`var(--app-header-height)`), zero imperative DOM manipulation (signals only), and clean cancel/escape modal dismissal.
7. **Frontend Security Invariants**: Closed-by-default routing (`canMatch` + `canActivate` on all feature routes), strict relative-path sanitization on return/redirect URLs, protocol whitelisting (`https://`) on `DomSanitizer.bypassSecurityTrust*`, and zero PII or tokens in URL parameters.

## Stack & Boundaries

- Angular 22, standalone components, SSR enabled, Angular Material v3, Tailwind v4.
- `libs/web/config`: environment & config tokens only.
- `libs/web/core/*`: shared cross-cutting web capabilities (auth, HTTP, testing, forms).
- `libs/web/ui`: shared design system UI components.
- Allowed cross-area imports: `libs/web/*` and `libs/shared/*`. **Never import from `libs/server/**`**.

## SSR Safety

- Guard `window`, `document`, `localStorage`, `ResizeObserver`, `navigator`, and WebAuthn APIs.
- Use `inject(PLATFORM_ID)` and `isPlatformBrowser()` for browser-only behavior.
- Defer DOM access to browser-safe lifecycle hooks (`afterNextRender` or `ngAfterViewInit` behind browser guards).

## Dev Tooling & Mock Isolation

- Never compile or activate dev-only mock interceptors or bypasses in production builds.
- Check `if (environment.production) return false;` as the very first line in any dev utility.
- Every mock/debug interceptor must have an automated test asserting it is inactive when `environment.production === true`.

## Pre-Commit Verification Checklist

Before opening a PR or declaring a web slice complete, run and pass:

1. Form Validation Audit: `npm run aidd:form-validation`
2. Scoped Unit Tests: `npx nx test <affected-project>`
3. Scoped Lint: `npx nx lint <affected-project>`
4. Live Route Audit: On visible UI changes, inspect the running route with Chrome DevTools and verify Lighthouse Accessibility $\ge 95$.
5. UI/UX Audit: Invoke `browser-uiux-auditor` on new or modified screens to verify zero-data empty states, responsive layout collapse (390px, 768px, 1280px), sticky offsets, and contrast.
6. Frontend Security Audit: Run `node scripts/aidd/frontend-security-audit.mjs --module <affected-module>` to ensure all routes are guarded, return URLs sanitized, and zero unvalidated sanitizer bypasses exist.
