# Merge Readiness Flow Playbook

Use this playbook before merging a Codex-created or Codex-reviewed pull request.

## Operator prompt

```text
Use AIDD mode. Check merge readiness for:
<PR URL or branch>

Read AGENTS.md, docs/aidd/README.md, docs/aidd/codex-review-checklist.md, and the changed files.
Do not edit. First produce:
1. PR scope summary
2. changed files by area
3. source docs checked
4. validation claimed in the PR
5. validation still required locally
6. conflicts or stale branch risks
7. final merge recommendation
```

## Merge readiness criteria

- PR scope is clear and limited.
- Relevant docs/specs are aligned.
- No unrelated formatting or file moves.
- Validation is run or explicitly deferred with a reason.
- Risks and follow-ups are visible.
- The branch is up to date or merge conflicts are understood.

## Local commands before merging

```powershell
npm run aidd:check
npm run aidd:assets
npm run aidd:links
npm run lint:affected
npm run test:affected
npm run build:affected
```

Use narrower commands when the PR is documentation-only or scoped to one project.
