---
name: browser-uiux-auditor
description: >-
  Conducts zero-code-context browser UI/UX audits and verification on web routes.
  Dispatches a browser subagent to stress-test responsive viewports (desktop,
  tablet, mobile), typography, color contrast, master-detail navigation, form
  lifecycles (pristine states, cancellation, validation boundaries), and sticky
  header margins, producing structured /10 scorecards and defect registries with
  optional automated remediation loops.
---

# Browser UI/UX Auditor

Autonomous browser-based visual, responsive, and functional auditing protocol. Evaluates web applications purely from an end-user perspective in a live browser without prior code context or DOM manipulation.

## When to Use

- Performing visual and functional quality checks on newly built or refactored UI features.
- Validating responsive behavior across desktop, tablet, and mobile breakpoints before PR merge.
- Stress-testing form ergonomics (initial pristine state, invalid submissions, sticky header clearance, cancellation).
- Verifying master-detail synchronization, search/filter reactivity, and badge/pill visual boundaries.
- Running iterative audit-fix-verify loops to achieve enterprise-grade design standards ($\ge 9.0/10$).

---

## Model & Effort Recommendations

| Engine                   | Recommended Model                    |  Effort  | Purpose                                                                                                                                                                                      |
| :----------------------- | :----------------------------------- | :------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Antigravity (Gemini)** | `gemini-3.8-flash` (or `flash` tier) | `medium` | **Browser Auditor Subagent:** Fast turnarounds across 50+ real browser interactions (clicks, inputs, scrolling, viewport resizing, perceptual visual evaluation).                            |
| **Antigravity (Gemini)** | `gemini-3.8-flash-medium` or `pro`   | `medium` | **Coordinator & Remediation:** Interpreting audit defect registries, applying code fixes, running tests, and managing re-audits.                                                             |
| **Codex**                | `gpt-5` (or `o3-mini`)               | `medium` | **Post-Audit Static Code Review:** When an independent review is required, invoke Codex (`angular-ssr-reviewer`) for SSR safety, hydration rules, and semantic accessibility code structure. |

---

## Non-Negotiable Inspection Matrix

Auditors must interact **solely through native browser events** (clicking, scrolling, typing, hovering, resizing). **No DOM manipulation**, style injection, or test-bypass scripts are permitted.

### 1. Typography & Visual Aesthetics

- **Scale & Weight:** Clear hierarchy between page title (`h1`), section titles (`h2`/`h3`), card headers, field labels, and helper text. Font weights must use standard steps (`400`, `500`, `600`).
- **Contrast Ratios:** Text must satisfy WCAG 2.1 AA (min 4.5:1 for body, 3:1 for large headings) and AAA wherever possible. Header branding logos and text must remain high-contrast on light/dark backgrounds.
- **Badge & Pill Boundaries:** Status pills and verification chips must hug their content tightly (`width: fit-content; display: inline-flex;`). They must never stretch to fill full-width flex/grid cells.

### 2. Viewport Tiers & Responsiveness

Auditors must explicitly test and report on the following standard viewports:

- **Desktop (`1440x900`):** Full multi-column layout, unclipped cards, zero horizontal scrollbar on document body.
- **Intermediate / Laptops (`960px`, `800px`):** Seamless breakpoint transition; top navigation links collapse into an accessible hamburger drawer (`Open navigation menu`).
- **Tablet (`768x1024`):** Clean column stacking or comfortable multi-row grid reflow.
- **Mobile (`375x667` & `414x896`):**
  - Document body width must match viewport width (no horizontal scrolling).
  - Search fields and filter dropdowns must stack vertically on viewports `< 480px` to prevent label truncation (e.g. avoiding "All Bra...").
  - Touch targets must be comfortably spaced ($\ge 36\text{px}$ touch targets).

### 3. Interactive Navigation & State Reactivity

- **Master-Detail Selection:** Selecting any record updates detail headers, avatars, and tab panels without visual flicker or layout shift.
- **Branch/Category Filters:** Changing filter options must immediately synchronize the detail pane with the newly filtered collection, preventing orphaned or stale selections.
- **Search Filtering:** Real-time search filters list instantly; clearing the input (or clicking the inline clear `(X)` icon) immediately restores all records.
- **Tab Switching:** Sub-tab transitions animate smoothly without horizontal scrollbar flickers (`animationDuration="0ms"` recommended on heavy tabs).

### 4. Form Ergonomics & Validation Boundaries

- **Pristine Initial State:** Opening creation mode (e.g. `+ Add Record`) must load in a 100% pristine state—**zero premature red outlines, invalid flags, or error banners** before user interaction.
- **Cancellation Flow:** Creation forms must provide a prominent "Cancel" button that cleanly aborts creation and restores the previously selected record without orphaned form state.
- **Validation Feedback & Positioning:** Submitting invalid inputs must trigger:
  1. High-contrast red field borders and labels (`#ba1a1a` / `#b91c1c`).
  2. Clear inline error messages directly beneath the corresponding inputs.
  3. Auto-focus shift to the first invalid control.
  4. Top dismissible alert banner and toast notifications.
- **Sticky Header Clearance:** Top banners and first form fields must have sufficient scroll margin (`scroll-margin-top: 90px`) to prevent occlusion behind sticky navigation bars when scrolled into view.

### 5. Usability & Polish

- **Dismiss Controls:** Banner alerts and notifications must include explicit interactive dismiss buttons (`(X)` or `Close`).
- **Empty States:** Filter combinations or tabs with no items must render clear, friendly empty state iconography and guidance text.
- **Tooltips:** Role chips and truncated text must feature native or accessible tooltips on hover.

---

## Audit Execution Protocol

### Step 1: Pre-Flight Health Check

Before dispatching the subagent, verify that the target web server is active and responding:

```powershell
pwsh -Command "Invoke-WebRequest -Uri <target_url> -UseBasicParsing | Select-Object StatusCode"
```

If offline, launch the development server before proceeding.

### Step 2: Dispatch the Browser Auditor Subagent

Invoke an independent `browser` subagent with `Model: "flash"` and zero code context using the prompt template below.

```json
{
  "TypeName": "browser",
  "Model": "flash",
  "Role": "UI/UX Verification Auditor",
  "Prompt": "<Parameterized prompt from references/audit-prompt-template.md>"
}
```

### Step 3: Evaluate Findings & Scorecard

The subagent delivers a structured report evaluated on a 10-point scale:

- **$\ge 9.0$ / 10:** Production Ready / Approved (Grade A).
- **$7.5 - 8.9$ / 10:** Needs Minor Polish (address edge-case observations).
- **$< 7.5$ / 10:** Action Required (blocking layout shifts, validation errors, or responsiveness defects).

### Step 4: Iterative Remediation Loop (Optional)

If defects or rough edges are surfaced:

1. Apply surgical code fixes targeting the reported selectors and styles.
2. Format touched files with Prettier (`npx prettier --write <files>`).
3. Run the nearest scoped test suite (`npx nx test <project>`).
4. Re-dispatch the code-agnostic browser auditor subagent to verify the fixes until a score $\ge 9.0$ is achieved.

---

## Reference Materials

- [Scorecard Template](references/scorecard-template.md): Standardized format for audit outputs.
- [Audit Prompt Template](references/audit-prompt-template.md): Parameterized prompt for subagent dispatch.
