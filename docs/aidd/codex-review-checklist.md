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

## Security and privacy

- [ ] No secrets or credentials were added.
- [ ] Sensitive data is not logged.
- [ ] Validation and authorization were not bypassed.
- [ ] User-facing errors do not leak internal details.

## Tests and validation

- [ ] Unit tests were added or updated for changed logic.
- [ ] Integration tests were added or updated for API/database behavior when relevant.
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

- [ ] After pushing a fix for a review thread, reply in the same thread with the fix summary and mention `@codex` so the reviewer is explicitly notified to verify it.
- [ ] Use a top-level `@codex review` comment only when requesting a whole-PR re-review instead of thread-specific verification.
