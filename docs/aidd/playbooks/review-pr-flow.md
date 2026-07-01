# Review PR Flow Playbook

Use this playbook when asking Codex to review a pull request or branch.

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
1. high-risk findings
2. file-specific findings
3. architecture or boundary concerns
4. API/schema/validation/doc traceability gaps
5. missing or weak tests
6. validation commands that should be run
7. merge readiness verdict
```

## Optional subagent prompt

```text
Spawn relevant project reviewers for architecture, API contract, security, testing, frontend SSR, backend NestJS/Prisma, and docs traceability. Wait for all results, deduplicate findings, and provide a consolidated review.
```

## Review notes

- For docs-only PRs, focus on instruction accuracy, source-of-truth alignment, broken paths, and runnable validation guidance instead of defaulting to build or test findings.
- For API or contract PRs, verify OpenAPI, DTO, mapper, and validation alignment explicitly.
- For Nx project changes, call out the narrowest meaningful `nx` validation targets that should back the review.
- When changed areas have layered scoped instructions, load all of them, such as `libs/server/AGENTS.md` plus `libs/server/features/auth/AGENTS.md`.
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
