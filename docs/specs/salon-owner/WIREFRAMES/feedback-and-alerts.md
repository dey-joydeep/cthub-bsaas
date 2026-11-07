# Feedback and Alert State Patterns Wireframes

## Purpose

Define the unified visual and interaction design patterns for operational feedback across Salon Partner web screens, including page-level status banners, asynchronous floating toasts, inline reactive form validation, and blocking conflict modals.

## Source Documents

- [Visual Collaboration Guideline](../../../quality-standards/visual-collaboration-guideline.md)
- [Salon Owner Web LLD](../WEB/web-lld.md#error-and-empty-states)
- [Shared LLD Patterns](../../shared/lld-patterns.md#accessibility)
- [Error Message Catalog](../../shared/error-message-catalog.md)
- [Staff Wireframes](./staff.md)
- [Service Catalog Wireframes](./service-catalog.md)
- [Global Stylesheet](file:///apps/web/partner/src/styles.css)

## Verified Penpot Board

| Screen state | Board name | Board ID | Purpose |
| :--- | :--- | :--- | :--- |
| Feedback & Alerts Baseline | `shared.feedback-and-alerts.desktop` | `841325ba-74b2-8009-8008-e8d9430d39e3` | Canonical visual schema for banners, toasts, inline errors, and modal conflict dialogs. |

Position in Penpot: `x = 3080, y = 5000` (located directly adjacent to Staff screen boards).

---

## Pattern Matrix

### 1. Page & Card Banners (Pinned Below Header)
- **Layout Behavior:** Rendered immediately below `<header class="catalog-header">`. **Pushes down** page content and grid layout.
- **Persistence:** Persistent until the user navigates, edits the form, or initiates a subsequent action.
- **Accessibility:** Uses WAI-ARIA live regions (`role="status"` for success/info, `role="alert"` for error/warning).
- **Styling Tokens:**
  - Base: `.salon-banner` (`display: flex`, `border-radius: 6px`, `padding: 8px 12px`, `font-size: 0.875rem`, `font-weight: 500`, `margin-bottom: 10px`)
  - **Success (`.salon-banner-success`):** `background: #f0fdf4`, `border: 1px solid #bbf7d0`, `color: #166534`, icon `check_circle`.
  - **Error (`.salon-banner-error`):** `background: #fef2f2`, `border: 1px solid #fecaca`, `color: #991b1b`, icon `warning`.
  - **Warning (`.salon-banner-warning`):** `background: #fffbeb`, `border: 1px solid #fde68a`, `color: #b45309`, icon `warning`.
  - **Info (`.salon-banner-info`):** `background: #eff6ff`, `border: 1px solid #bfdbfe`, `color: #1e40af`, icon `info`.

### 2. Floating Toast / Snackbar (MatSnackBar)
- **Layout Behavior:** Anchored to viewport bottom-center or bottom-right overlay (`z-index: 1000`). Floats over screen without shifting content.
- **Persistence:** Auto-dismisses after 3–5 seconds. Includes an explicit `Close` action button.
- **When to Use:** Transient, low-urgency confirmations for background operations (e.g. Appointment rescheduling, Profile updates, Dashboard refresh).
- **Styling Tokens:** Dark theme surface `#0f172a`, text `#f8faFc`, action CTA `#38bdf8`.

### 3. Inline Form Field Validation (<mat-error>)
- **Layout Behavior:** Rendered directly below individual `<mat-form-field>` controls.
- **Persistence:** Dynamic; activates when the control is dirty/touched and invalid, and clears as soon as the input satisfies validation.
- **When to Use:** Field-level format and required violations (e.g. invalid email regex, non-positive price, missing duration).
- **Styling Tokens:** Input border `#ef4444`, label and helper text `#dc2626` (fontSize: `0.75rem`).

### 4. Blocking Conflict Modal (MatDialog)
- **Layout Behavior:** Centered viewport overlay with a dimmed backdrop layer (`backdrop-filter: blur(2px)`). Blocks background interaction.
- **Persistence:** Requires explicit user action (`Cancel` or `Resolve`).
- **When to Use:** Unrecoverable or high-stakes collisions (e.g. Roster shift conflict overlapping with confirmed bookings, or archiving a service with future appointments).
- **Related Boards:** `staff.schedule-conflict.desktop` (`a7a9ed20-bb04-8098-8008-08d8155e3c2c`), `service-catalog.archive-conflict.desktop` (`a7a9ed20-bb04-8098-8008-08d86353c453`).
