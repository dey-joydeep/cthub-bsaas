# UI/UX Usability & Visual Audit Scorecard Template

```markdown
# UI/UX Usability & Visual Audit Report: [Screen / Feature Name]

**Target Application:** [e.g. BeautySaaS Partner Portal]
**Target URL:** [e.g. http://localhost:4201/business/staff]
**Audit Viewports Tested:** Desktop (1440x900), Intermediate/Laptop (960px, 800px), Tablet (768x1024), Mobile (375x667)
**Auditor:** Independent Visual & Usability Browser Subagent

---

## Executive Summary

[High-level summary of the visual, responsive, and functional assessment]

---

## Category Scores

| Category                                           |  Score   |                  Status                   |
| :------------------------------------------------- | :------: | :---------------------------------------: |
| **1. Visual Aesthetics, Typography & Contrast**    | **/ 10** |    [Exceptional / Good / Needs Polish]    |
| **2. Responsive Design & Viewport Stress Testing** | **/ 10** |   [Robust / Acceptable / Defects Found]   |
| **3. Navigation & Interactive Workflows**          | **/ 10** |     [Highly Intuitive / Needs Tuning]     |
| **4. Form Ergonomics & Validation Boundaries**     | **/ 10** |   [Flawless / Minor Issues / Blocking]    |
| **Overall Score**                                  | **/ 10** | **[Grade A / Grade B / Action Required]** |

---

## Detailed Findings by Protocol Area

### 1. Typography & Visual Aesthetics

- **Scale, Weights & Readability:** [Notes on heading scale, label readability, font hierarchy]
- **Contrast Ratios:** [Notes on WCAG AA/AAA compliance on headers, buttons, labels]
- **Badges & Pills:** [Tight content fit check, no horizontal flex stretching]

### 2. Responsive Design & Viewports

- **Desktop (1440x900):** [Multi-column layout, unclipped cards]
- **Intermediate & Tablet (960px, 768px):** [Drawer navigation trigger check, layout stacking]
- **Mobile (375x667):** [Vertical control stacking, label truncation check, zero horizontal page scrollbars]

### 3. Click-Through & Navigation Flows

- **Master-Detail Selection:** [Selection updates, no layout flickers]
- **Filtering & Search:** [Instant filter, clean synchronization of detail view]
- **Sub-Tab Navigation:** [Smooth tab transitions, no overflow flickers]

### 4. Form Ergonomics & Validation Boundaries

- **Pristine State on Creation:** [Zero premature red outlines before user interaction]
- **Cancellation Flow:** [Cancel button presence and clean restoration]
- **Validation Feedback & Positioning:** [Inline errors, banner alerts, sticky header clearance `scroll-margin-top`]

### 5. Usability & Polish

- **Dismiss Controls:** [Banners and toast notifications dismissible]
- **Empty States:** [Iconography and helpful text when filters yield 0 records]

---

## Defect Registry & Polish Opportunities

1. **[Defect Title]:**
   - **Severity:** [Blocker / High / Medium / Low]
   - **Steps to Reproduce:**
   - **Expected Behavior:**
   - **Observed Behavior:**
   - **Recommended Fix:**

---

## Final Verdict

**VERDICT: [APPROVED (Grade A) / ACTION REQUIRED]**
```
