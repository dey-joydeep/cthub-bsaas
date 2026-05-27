# Review PR Flow Playbook

Use this playbook when asking Codex to review a pull request or branch.

## Operator prompt

```text
Use AIDD mode. Review this PR:
<PR URL or branch name>

Read:
- AGENTS.md
- nearest scoped AGENTS.md for changed areas
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

## Review severity

| Severity | Meaning |
| --- | --- |
| Blocker | Must fix before merge. |
| High | Strongly recommended before merge. |
| Medium | Should fix or track. |
| Low | Optional improvement. |
| Note | Context only. |
