# Codex Review Checklist

**Status:** Current operating guide

Use this checklist when Codex reviews its own changes, reviews a pull request, or prepares a completion report.

For a merge gate, the Codex reviewer must be independent of the implementer. Security checks are owned by Codex; critical security decisions require a second independent Codex assessment. See [development-lifecycle.md](development-lifecycle.md).

## Scope and traceability

- [ ] The change matches the requested scope.
- [ ] The smallest safe diff was used.
- [ ] Related HLD, LLD, API contract, test plan, or README files were checked.
- [ ] Design/spec documents were updated when behavior or contracts changed.
- [ ] Implementation changes follow `docs/specs/project-wide/IMPLEMENTATION/implementation-slicing.md` when the work belongs to the project-wide roadmap.
- [ ] API changes align with the owning OpenAPI file and endpoint map.
- [ ] Check the actual producer and consumer for changes that cross an API or session boundary.
- [ ] No unrelated files were reformatted or moved.

## Architecture

- [ ] Nx project boundaries are respected.
- [ ] Backend logic remains in `libs/server` and app bootstrap remains thin.
- [ ] Frontend shared logic remains in `libs/web/core`, `libs/web/ui`, or the correct persona library.
- [ ] Shared code remains framework-agnostic where practical.
- [ ] Existing patterns were reused instead of adding new patterns.

## Backend

- [ ] Controllers remain thin.
- [ ] DTOs, validation, and error codes are explicit.
- [ ] Repository/data-access patterns are followed.
- [ ] Prisma/schema changes include migration and documentation impact.
- [ ] Auth, CSRF, throttling, cookie, and guard behavior were not weakened.

## Frontend

- [ ] Angular code is SSR-safe.
- [ ] Tailwind classes use the `twc-` prefix.
- [ ] Loading, empty, error, validation, and success states are handled.
- [ ] Shared UI was not duplicated in persona-specific libraries.
- [ ] Accessibility and keyboard behavior were considered for UI changes.
- [ ] Canvas & Viewport Ergonomics: Operational SaaS pages use fluid or high-ceiling responsive containers (`max-width: 1680px` or `100%`), avoiding narrow marketing-width bottlenecks (`max-width: 1200px`) that create dead whitespace gutters (>20% of desktop viewport).
- [ ] Vertical Viewport Budget & Fold: Operational headers, banners, and tab bars do not exceed $120\text{px}$ combined height. No marketing hero banners or descriptive paragraphs on operational pages. Primary workspace controls (search, filter, list items, first form card) are visible above the fold on desktop viewports without scrolling.
- [ ] Action Deduplication & Scoping: Primary actions have a single logical home. No duplicate creation buttons between parent headers and child toolbars. Scoped creation actions belong to their active tab or list sidebar.
- [ ] Micro-Alignment & Baseline Centering: All icon + text pairings use `display: inline-flex; align-items: center; gap: 0.5rem;` (or Tailwind `inline-flex items-center gap-2`) with explicit matching icon dimensions (`20px` / `1.25rem`), eliminating baseline drift or staggered misalignment.
- [ ] 5-Point Visual Heuristic Audit: The rendered UI was visually inspected via screenshot on a desktop viewport against the 5-point checklist (Fold visibility, Action deduplication, Micro-alignment, Negative space/density, Contextual scoping). Form inputs (especially `datetime-local` and dropdowns) meet minimum readable widths ($\ge 220\text{px}$) without truncation or clipping. Text-only DOM accessibility trees do not replace visual screenshot review.

## Security and privacy

- [ ] No secrets or credentials were added.
- [ ] Sensitive data is not logged.
- [ ] Validation and authorization were not bypassed.
- [ ] Producer-Consumer Parity: Any new claim, capability, or user-context property consumed by guards/UI has an active, verified production producer (database query, token generator, or API payload).
- [ ] User-facing errors do not leak internal details.

## Dependencies and packages

- [ ] Match engines in `package.json` and `.nvmrc`.
- [ ] Package installation: NEVER EVER use `--legacy-peer-deps` when installing or updating packages; resolve peer dependency conflicts cleanly.
- [ ] Dependency changes follow `docs/aidd/dependency-policy.md`: owner and reason per direct package, manifest/lockfile consistency, review of new install scripts, and high-severity audit on lockfile changes.

## Tests and validation

- [ ] Unit tests were added or updated for changed logic.
- [ ] Integration tests were added or updated for API/database behavior when relevant.
- [ ] Permission and SSR tests exercise the actual behavior claimed.
- [ ] CI scripts preserve command failures and provision their test services.
- [ ] Full-Slice Token Test: Real token generation or auth sign-in pipeline is tested to confirm newly added claims/capabilities are emitted in production.
- [ ] Validation commands were run or explicitly reported as not run.
- [ ] Test coverage thresholds were not weakened.
- [ ] No tests were skipped just to pass CI.
- [ ] OpenAPI lint/parity checks were run for touched API contracts.

## Completion report

- [ ] Summary is clear.
- [ ] Files touched are listed.
- [ ] Commands run and results are listed.
- [ ] Commands not run and reasons are listed.
- [ ] Risks and follow-ups are listed.

## Review thread follow-up

- [ ] Request the initial whole-PR review with a top-level PR comment containing the exact trigger `@codex review`.
- [ ] Assign each actionable finding to a fixing agent and inspect its fix and validation before requesting a recheck.
- [ ] After pushing the fix, reply in the original review thread with `@codex review fix`, the fix commit, a short explanation, and validation evidence. This thread-level wording has produced Codex rechecks in this repository; it is an observed behavior, not a separately documented OpenAI command.
- [ ] Confirm Codex replied with a substantive recheck or a review receipt for the current head. A usage-limit reply, an unanswered mention, or a receipt for an older head does not close the finding. If thread follow-up does not work, request a top-level `@codex review` with links to the outstanding threads.
- [ ] Resolve the original GitHub thread only after the finding is verified. A Codex agent that made a fix cannot be its sole independent reviewer.
- [ ] After all actionable findings are closed, request a fresh whole-PR review of the final committed head with a top-level `@codex review` comment.
