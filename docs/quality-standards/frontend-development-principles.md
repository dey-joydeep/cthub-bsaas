# Frontend Development Principles and Architecture Standards

**Status:** Authoritative Standard  
**Applies to:** `apps/web/**`, `libs/web/**`  
**Governing ADRs:** [ADR-0006: Form Validation & Template Coverage](../architecture/decisions/0006-frontend-form-validation-and-template-coverage.md)

---

## 1. Multi-Locale Architecture & Day-1 i18n Baseline

CTHub BSaaS is a multi-locale platform supporting English (`en-US`), Japanese (`ja-JP`), and Bengali (`bn-BD`). Internationalization is **core baseline architecture**, not post-launch polish. Hardcoded text literals in templates or components are strictly prohibited from day one.

### 1.1 Structural Scaffolding vs. Translation Content

- **Day-1 Scaffolding (Mandatory for Every PR)**: Every user-facing string must be tagged with a canonical translation key at authoring time.
- **Language Content (Iterative)**: Extracting strings to `messages.xlf` and translating into Japanese and Bengali files can be scheduled asynchronously, but the template and code keys must exist from the initial commit.

### 1.2 Canonical Key Naming Convention

Keys follow the hierarchical format: `@@<MODULE>.<COMPONENT_OR_AREA>_<TARGET>`

- Examples:
  - Form labels: `@@STAFF_CATALOG.LABEL_PHONE`
  - Placeholders: `@@STAFF_CATALOG.PLACEHOLDER_SEARCH_STAFF`
  - Action buttons: `@@STAFF_CATALOG.BTN_SAVE_STAFF`
  - Validation errors: `@@STAFF_CATALOG.ERROR_PHONE_REQUIRED`, `@@STAFF_CATALOG.ERROR_PHONE_PATTERN`
  - Status notifications: `@@STAFF_CATALOG.MSG_STAFF_SAVED`

### 1.3 Implementation Syntax

1. **Template Text Nodes**:
   ```html
   <h2 i18n="@@STAFF_CATALOG.TITLE_PROFILE">Staff Profile</h2>
   <button mat-flat-button i18n="@@STAFF_CATALOG.BTN_SAVE">Save staff</button>
   ```
2. **Template Attributes (Placeholders, Tooltips, Aria-Labels)**:
   Always use the `i18n-<attr>="@@KEY"` syntax. Never nest HTML tags inside attribute strings:
   ```html
   <input
     matInput
     placeholder="Search by name, email..."
     i18n-placeholder="@@STAFF_CATALOG.PLACEHOLDER_SEARCH"
     aria-label="Filter staff list"
     i18n-aria-label="@@STAFF_CATALOG.ARIA_FILTER_STAFF"
   />
   ```
3. **TypeScript / Signal Localization**:
   Use native tagged template literals with `$localize`:
   ```ts
   this.error.set($localize`:@@STAFF_CATALOG.ERROR_FORM_INVALID:Please correct the highlighted fields before saving.`);
   ```
4. **Testing Invariant**:
   Never provide or mock `TranslateService` or `TranslateModule`. Angular's native `$localize` automatically falls back to the default English string during unit tests. Tests must assert against the default English string directly.

---

## 2. Enterprise 3-Tier Form Validation Architecture (ADR-0006)

No form submission may ever fail silently or rely solely on a red border outline. Every form follows the standardized 3-Tier Error Hierarchy:

```
+-------------------------------------------------------------------------+
| Tier 3: Domain / State Conflict (HTTP 409 / 403)                        |
| Top Accessible Alert Banner (`role="alert"`) + Floating MatSnackBar     |
| Preserves user draft input without resetting form state                 |
+-------------------------------------------------------------------------+
| Tier 2: Field-Level Server Validation (HTTP 422 Uniqueness / Quota)     |
| Bound to controls via `applyServerValidationErrors(form, error)`        |
| Rendered in `<mat-error>{{ control.getError('serverError') }}</mat-error>`|
+-------------------------------------------------------------------------+
| Tier 1: Client Synchronous Validation                                   |
| Controls with validators (Validators.required, pattern, minLength, etc.)|
| Must declare matching `<mat-error>` elements in HTML                    |
| Invalid submit: form.markAllAsTouched() + scrollToFirstInvalidControl()  |
+-------------------------------------------------------------------------+
```

### 2.1 Viewport Invariance & Scroll-Resilient Feedback

When users scroll down long operational forms to reach a submit button:

1. **Instant Floating Toast (`MatSnackBar`)**:
   - Success: `snackBar.open(msg, 'Close', { duration: 3500, horizontalPosition: 'center', verticalPosition: 'bottom' })`
   - Error / Conflict: `snackBar.open(error, 'Close', { duration: 6000, horizontalPosition: 'center', verticalPosition: 'bottom', panelClass: ['salon-snack-error'] })`
2. **Auto-Scroll to First Invalid Field**:
   On `form.invalid`, invoke `scrollToFirstInvalidControl()` from `@cthub-bsaas/web-core-common`. It smoothly centers the invalid input in the viewport and transfers keyboard focus to it.
3. **Persistent Accessible Banner**:
   Keep the top banner with `role="alert"` (or `role="status"` for success) intact for screen readers and persistent record.

### 2.2 Phone Number Format Validation

- Phone fields must enforce valid international/national structures using `phoneNumberValidator()` from `@cthub-bsaas/web-core-common`.
- Strictly rejects trailing hyphens (e.g. `+81-90-`), incomplete fragments, and under-digit numbers (< 9 digits).

---

## 3. Operational Viewport Budget & The Above-the-Fold Law

CTHub BSaaS is an operational workstation, not a marketing website. Salon owners and managers spend hours managing appointments, shifts, and catalogs.

### 3.1 The Above-the-Fold Law

- Standard desktop viewports provide $\sim 750\text{px} - 800\text{px}$ of usable vertical height.
- **The $120\text{px}$ Stack Budget**: The combined height of all headers, top navigation bars, page titles, and tab navigation must not exceed $120\text{px}$.
- The primary interactive working surface (master list, search input, filter chips, first form card) must be visible above the fold on desktop without scrolling.

### 3.2 Action Deduplication

- Primary actions must have a single logical home.
- Never duplicate identical action buttons in page headers and child list toolbars (e.g. having `+ Add Staff` in the page title bar AND `+ Add Staff Member` in the sidebar). Contextual actions belong to their active pane.

### 3.3 Micro-Alignment & Typography Invariants

- Any container pairing an icon with text must use:
  ```css
  display: inline-flex;
  align-items: center;
  gap: 0.5rem; /* gap-2 */
  ```
- Icons must declare explicit bounding boxes (`font-size: 1.25rem; width: 1.25rem; height: 1.25rem; flex-shrink: 0; line-height: 1;`) to eliminate baseline drift and staggered floating.

---

## 4. WCAG 2.1 AA Accessibility & Color Contrast

All web pages must pass WCAG 2.1 AA and maintain Lighthouse Accessibility scores $\ge 95$:

### 4.1 Strict Contrast Ratios

- Normal text (< 18pt / 24px) requires a minimum contrast ratio of **4.5:1** against its background.
- Selected, active, and hover states must be tested for contrast. For example, text on light-blue selection backgrounds (`#eff6ff`) must use `#475569` or darker (providing $\ge 5.2:1$ contrast), never light gray `#64748b` (which drops to 4.37:1 and fails).

### 4.2 Accessible Names & Labels

- Every icon-only button, menu trigger, or control must have an `aria-label` or `aria-labelledby` attribute.
- **No Double-Asterisks**: Angular Material's MDC `<mat-form-field>` automatically appends an asterisk when a control has `Validators.required`. Never write hardcoded `*` in `<mat-label>` (e.g. write `<mat-label>Phone</mat-label>`, never `<mat-label>Phone *</mat-label>`).

---

## 5. High-Fidelity Testing & AOT Coverage Preservation

### 5.1 Mandatory Negative DOM Unit Tests

Every component managing a `FormGroup` must contain explicit negative path tests in its `*.spec.ts`:

1. Submitting an invalid form renders `<mat-error>` elements in the DOM.
2. Renders the accessible `.salon-banner-error` alert with `role="alert"`.
3. Invokes `MatSnackBar` toast notification.
4. Asserts that the underlying API service save method was **not** called.

### 5.2 Strict Prohibition of `TestBed.overrideComponent` (Angular CLI #30127)

- Never use `TestBed.overrideComponent` in unit tests.
- Overriding component metadata strips AOT compiler metadata and breaks source-mapping for template code coverage.
- Dependencies and child components must be mocked using standard Angular DI providers (`{ provide: Service, useValue: mock }`) or standalone test harness imports.

### 5.3 Live Browser Audits Prior to Slice Completion

- Text-only snapshot checks do not substitute for visual verification.
- Agents must run live Lighthouse audits via `chrome-devtools-mcp` on active routes before declaring a UI deliverable complete.

---

## 6. Screen Ergonomics & UI/UX Invariants

To avoid costly multi-round audit regressions during screen authoring, agents must adhere to these five operational UI/UX invariants from the initial draft:

### 6.1 Zero-Data & Empty State Baseline

- Every list, table, master-detail view, and filtered search **must** declare an empty state container rendered when item count is 0 (`@if (items().length === 0)`).
- An empty state must contain:
  1. An informative icon (`mat-icon` with explicit bounding box).
  2. A clear title and explanatory helper text describing why the view is empty.
  3. A **Primary Call-To-Action (CTA)** button to create the first record (e.g. `+ Add Staff Member`), or a **Clear Filters** CTA if the empty state is due to active search/filtering.
- Empty states must never leave a blank canvas, an unstyled placeholder, or an ambiguous loading skeleton.

### 6.2 Responsive Collapse & Viewport Adaptation (<1024px)

- **Master-Detail Invariant**: Never maintain side-by-side split columns on viewports $< 1024\text{px}$ (tablet and mobile).
- On screens $< 1024\text{px}$, the detail pane must fold into a full-screen drawer/slide-over or dedicated route view with an accessible back button (`<- Back to list`).
- **Touch Targets**: All interactive elements (buttons, chips, icon toggles, menu triggers) must provide a minimum tap target of $44 \times 44\text{px}$ on touch-enabled or narrow viewports.

### 6.3 Sticky Clearance & Header Offsets

- Sticky toolbars, tab headers, sub-navigation bars, and table headers must account for the app shell header stack:
  ```css
  top: var(--app-header-height, 4rem); /* Never hardcode top: 0 */
  ```
- Failure to declare header offsets causes sticky controls to slide underneath or clip into the app shell navigation during scrolling.

### 6.4 Declarative Reactive State Purity

- **Strict Ban on Imperative DOM Manipulation**: Agents must never call `document.getElementById`, `document.querySelector`, `Element.scrollIntoView` (outside utility helpers), or mutate `.style` properties directly in component TypeScript files.
- All selection states, open/closed panels, active tabs, validation borders, and conditional classes must be driven declaratively through Angular signals (`signal`, `computed`, `linkedSignal`) and template bindings (`[class.active]="..."`, `@if`, `@for`).

### 6.5 Form Lifecycle & Pristine Dismissal

- Modal dialogs, slide-over panels, and inline edit forms must provide unambiguous cancellation paths:
  1. The `Escape` key must dismiss open drawers/dialogs.
  2. Clicking `Cancel` must discard uncommitted inputs and restore pristine master state without leaving dirty form flags or stale validation banners in the view.

---

## 7. Frontend Security Invariants

All client-side applications (`apps/web/**`) and feature libraries (`libs/web/**`) must adhere to these defensive security rules at authoring time:

### 7.1 Closed-by-Default Route Guarding (CWE-285, CWE-862)

- Application routes declared in `app.routes.ts` are **closed by default**.
- Every route leading to operational features, settings, lists, or catalogs must declare both route matching and activation guards:
  ```ts
  {
    path: 'business/staff',
    canMatch: [authCanMatch],
    canActivate: [roleGuard],
    data: {
      roles: [UserRole.OWNER, UserRole.STAFF, UserRole.ADMIN],
    },
    loadChildren: () => import('@cthub-bsaas/web-partner').then((m) => m.STAFF_SERVICE_CATALOG_ROUTES),
  }
  ```
- Public routes (e.g. `/login`, `/register`, `/booking/:slug`) are explicit exceptions and must be documented as unauthenticated entry points.

### 7.2 Open Redirect & Navigation Parameter Sanitization (CWE-601)

- Never pass raw route query parameters (`returnUrl`, `redirect`, `callback`) directly into `router.navigateByUrl()` or `window.location`.
- Any return or redirection parameter must be sanitized to ensure it is a relative path starting with a single forward slash:
  ```ts
  function sanitizeReturnUrl(rawUrl: string | null): string {
    if (!rawUrl || typeof rawUrl !== 'string') {
      return '/dashboard';
    }
    // Must be a relative path starting with single '/', rejecting '//', schemes (':'), and backslashes ('\')
    if (rawUrl.startsWith('/') && !rawUrl.startsWith('//') && !rawUrl.includes('\\') && !rawUrl.includes(':')) {
      return rawUrl;
    }
    return '/dashboard';
  }
  ```

### 7.3 DomSanitizer Bypass Whitelisting (CWE-79)

- Unconditional invocations of `DomSanitizer.bypassSecurityTrustResourceUrl`, `bypassSecurityTrustHtml`, or `bypassSecurityTrustScript` are strictly forbidden.
- Any pipe, directive, or service that trusts dynamic resources must validate the scheme or domain against an explicit allowlist:
  ```ts
  transform(url: string | null | undefined): SafeResourceUrl {
    if (!url || typeof url !== 'string' || !url.startsWith('https://')) {
      return '';
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
  ```

### 7.4 Sensitive Parameter & PII Hygiene in URLs (CWE-598)

- URL query parameters and hash fragments are reserved strictly for non-sensitive view state (`tab`, `search`, `page`, `sort`, `filter`).
- Never pass authentication tokens, passwords, customer/staff PII (phone numbers, email addresses, national IDs), or sensitive financial parameters in URL query strings or browser history.
