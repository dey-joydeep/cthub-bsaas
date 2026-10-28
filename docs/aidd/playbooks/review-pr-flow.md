# Review PR Flow Playbook

Use this playbook when asking Codex to review a pull request or branch.

Independent review is a required Codex gate in the [development life cycle](../development-lifecycle.md). The reviewer must be distinct from the implementer. Route security checks to a Codex security reviewer, with two independent Codex assessments for critical security decisions.

## Operator prompt

```text
Follow the repository AIDD workflow. Review this PR:
<PR URL or branch name>

Read:
- AGENTS.md
- every scoped AGENTS.md required for the changed areas
- docs/aidd/README.md
- docs/aidd/codex-review-checklist.md
- relevant FRD/FNRD/HLD/LLD/API/VALIDATION/WEB/TEST docs

Do not edit. First produce a review with:
1. reviewer identity and the reviewed base/head commits (or a provisional working-tree boundary)
2. whole-PR or finding-closure scope
3. prioritized file-specific findings, including architecture, contract, security, and test gaps
4. affected callers and failure paths inspected or omitted
5. validation evidence and remaining commands
6. finding dispositions and merge-readiness verdict
```

## Specialist reviewer prompt

```text
Use one independent Codex reviewer by default. Apply architecture, API, security, testing, frontend, backend, and docs lenses to the affected paths. Add a specialist only for a concrete expertise gap or the lifecycle's critical-decision threshold; give each a distinct question and reconcile the findings.
```

## Review notes

- For docs-only PRs, focus on instruction accuracy, source-of-truth alignment, broken paths, and runnable validation guidance instead of defaulting to build or test findings.
- For API or contract PRs, verify OpenAPI, DTO, mapper, and validation alignment explicitly.
- For Nx project changes, call out the narrowest meaningful `nx` validation targets that should back the review.
- When changed areas have layered scoped instructions, load all of them, such as `libs/server/AGENTS.md` plus `libs/server/features/auth/AGENTS.md`.
- Review a corrected finding across its defect class and affected sibling paths. After known findings close, request one fresh whole-PR review of the final committed head. A new commit makes the earlier final verdict stale.
- After pushing a fix for a review thread, reply in that same thread with the fix summary and mention `@codex` so the reviewer is explicitly asked to verify it.
- Use a top-level `@codex review` comment only when you want a whole-PR re-review rather than a thread-specific follow-up.

## Review severity

| Severity | Meaning                            |
| -------- | ---------------------------------- |
| Blocker  | Must fix before merge.             |
| High     | Strongly recommended before merge. |
| Medium   | Should fix or track.               |
| Low      | Optional improvement.              |
| Note     | Context only.                      |
