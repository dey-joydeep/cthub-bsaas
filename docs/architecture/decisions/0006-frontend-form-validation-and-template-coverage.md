# ADR-0006: Frontend Form Validation, 3-Tier Error Hierarchy, and Template Test Coverage

- **Status:** Accepted
- **Date recorded:** 2026-11-08
- **Original decision date:** 2026-11-08
- **Owner:** Solution architect & Senior frontend developer
- **Decision maker:** Lead architect & Product owner (Authorized in PR #46)
- **Related issue/PR:** PR #46 (`feature/web-staff-service-catalog`)
- **Supersedes / superseded by:** None

## Context

During implementation of operational SaaS management screens (e.g. Staff Management and Service Catalog), user testing revealed a silent validation failure: clearing a required field and clicking "Save" produced a red outline on `<mat-form-field>` without any error text or accessible alert banner. Investigation showed:

1. Reactive form controls in TypeScript declared validators (`Validators.required`, `Validators.minLength(2)`), but matching `<mat-error>` elements were omitted in HTML templates.
2. Form submission handlers silently returned on `this.form.invalid` without setting the top-level error banner signal.
3. Unit tests reported 100% green (163 tests passed) because tests exclusively executed happy paths with valid mock data; no test asserted `form.invalid` or DOM error rendering.
4. Standard code coverage (Vitest / Istanbul) only measured `.ts` controller execution, completely blinding CI to unexercised template elements and branches.
5. In Angular CLI Issue #30127, it was established that while modern AOT unit testing enables HTML template code coverage, calling `TestBed.overrideComponent` invalidates AOT metadata and breaks source-mapping for template coverage.

A repository-wide decision is needed to standardize form validation, error presentation, server-side error mapping, and automated mechanical enforcement across all web packages (`apps/web/**` and `libs/web/**`).

## Decision drivers

- **Zero Silent Failures**: No form submission may ever fail silently or rely solely on a red outline.
- **Accessible & Consistent Feedback**: Adhere to WCAG 2.1 AA / Section 508 with accessible inline errors (`<mat-error>`) and top-level announcement banners (`role="alert"`).
- **Distinction Between Field Errors & Domain Conflicts**: Handle local syntax validation, backend uniqueness constraints (HTTP 422), and cross-entity business state machine conflicts (HTTP 409) distinctly without data loss.
- **Precision & Zero False Positives**: Static tooling must strictly distinguish validated inputs from optional unvalidated inputs (e.g. search boxes, notes, filters).
- **Automated Verification Over Memory**: Prevent process drift through AST/linter checks and mandatory negative DOM test cases.
- **Preservation of Template Coverage**: Avoid test patterns like `TestBed.overrideComponent` that corrupt Angular AOT template source-mapping.

## Options

| Option                                                                                              | Benefits                                                                                                       | Costs and risks                                                                                                | Evidence                                                     |
| :-------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------- |
| **Option A: Blanket `<mat-error>` rule on all `<mat-form-field>`**                                  | Simple regex or AST check                                                                                      | High false positive rate on optional fields (`notes`, `addressLine2`, search filters). Annoying to developers. | Fails in practice on unvalidated inputs.                     |
| **Option B: Manual checklist in Markdown documentation**                                            | No tooling overhead                                                                                            | Process drift occurs immediately; already failed in Staff Service Catalog.                                     | Direct historical evidence in PR #46.                        |
| **Option C: 3-Tier Error Model + Smart Validator-Pairing Linter + Negative Test Contract (Chosen)** | Eliminates false positives, enforces exact pairing, handles server 422/409 cleanly, and protects AOT coverage. | Requires initial shared core utility and AST script.                                                           | Directly addresses root causes of PR #46 and Angular #30127. |

## Decision

We adopt **Option C: The Enterprise 3-Tier Error Model and Mechanical Verification Architecture**:

### 1. The 3-Tier Error Hierarchy

1. **Tier 1: Client-Side Synchronous Validation**
   - Inputs with client validators (`Validators.required`, `Validators.pattern`, `Validators.minLength`, or HTML `required`) **must** include corresponding `<mat-error>` elements in HTML.
   - Purely optional fields with zero validators do not require `<mat-error>`.
   - On `form.invalid` submission, handlers must invoke `form.markAllAsTouched()` AND set `this.error.set('Please correct the highlighted fields before saving.')`.
2. **Tier 2: Field-Level Server Validation (HTTP 422 Uniqueness / Quota / Foreign Key)**
   - Backend returns `{ errors: [{ field, message }] }`.
   - The shared utility `applyServerValidationErrors(form, error)` in `libs/web/core/common` binds `{ serverError: message }` to the specific `FormControl` and marks it touched.
   - The template displays `<mat-error>{{ control.getError('serverError') }}</mat-error>`.
3. **Tier 3: Domain State-Machine & Concurrency Conflicts (HTTP 409 / 403)**
   - Cross-entity business rules (e.g. BR-ST-11 last active owner deactivation, active booking collisions).
   - Displayed in the accessible **Top Alert Banner** (`role="alert"`), leaving the user's form inputs intact.

### 2. Mandatory DOM Unit Testing Invariant

Every component managing a `FormGroup` must contain explicit negative path tests in its `*.component.spec.ts`:

- Clear required fields, trigger save, and assert:
  1. `component.error()` is set.
  2. The DOM contains `.salon-banner-error` with alert role.
  3. The DOM contains `<mat-error>` with the expected validation message.
  4. The underlying API service save method was **not** called.

### 3. Prohibition of `TestBed.overrideComponent`

To protect Angular AOT template source-mapping for code coverage (per Angular CLI Issue #30127), `TestBed.overrideComponent` is strictly prohibited in unit test suites. Dependencies and child components must be mocked using standard Angular dependency injection providers or test harness imports.

### 4. Smart Static Verification Gate

A dedicated mechanical check (`scripts/aidd/check-form-validation.mjs`) is added to the repository's verification pipeline (`npm run aidd:check` and CI). It parses templates and component form definitions to ensure validated controls are paired with `<mat-error>` while ignoring optional unvalidated controls.

## Consequences and follow-up

- **Developer & Agent Experience**: Eliminates guesswork. Clear compiler and lint errors guide developers when creating new forms.
- **Core Library Enhancement**: Adds `server-form-errors.ts` to `libs/web/core/common` for standard cross-application reuse.
- **Repository Rollout**:
  1. Add `server-form-errors.ts` and test suite in `libs/web/core/common`.
  2. Add `scripts/aidd/check-form-validation.mjs` and register in `check-aidd-setup.mjs`.
  3. Update `libs/web/AGENTS.md` to mandate the 3-Tier model and ban `overrideComponent`.
  4. Perform workspace-wide baseline scan and remediate non-compliant forms slice by slice.

## Review and history

- 2026-11-08: Proposed, refined with user feedback on avoiding false positives/negatives, and Accepted.
