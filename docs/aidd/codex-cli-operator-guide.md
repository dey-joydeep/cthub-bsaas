# Codex CLI Operator Guide

**Status:** Current operating guide

Use this guide when operating Codex from the local repository.

## Start session

```powershell
cd E:\workspace\cthub-bsaas
codex
```

First prompt for meaningful work:

```text
Use AIDD mode. This is a new task.
Read AGENTS.md, the nearest scoped AGENTS.md, and docs/aidd/README.md before planning or editing.
Do not edit yet. First classify the task, identify source-of-truth docs, impacted files, validation commands, and risks.
```

## Useful slash commands

| Command | Use |
| --- | --- |
| `/status` | Check current session and workspace status. |
| `/diff` | Review local changes before continuing. |
| `/review` | Ask Codex to review current changes. |
| `/skills` | Inspect available skills and confirm whether a task-specific skill exists. |
| `/agent` | Work with configured reviewer agents when the task benefits from parallel review. |
| `/hooks` | Inspect project and user hooks. |

## Recommended operator prompts

### Plan only

```text
Use AIDD mode. Do not edit files.
Review the source docs and code, then produce a plan with impacted areas, validation commands, and risks.
```

### Implement from approved docs

```text
Use AIDD mode. Implement from the approved LLD/API/VALIDATION/WEB/TEST docs.
Keep the diff surgical. Update tests and docs only where behavior or contracts change.
```

### PR review

```text
Use AIDD mode. Review this PR using docs/aidd/codex-review-checklist.md.
Use relevant reviewer agents if available. Do not edit files.
```

### Validation follow-up

```text
Use AIDD mode. This is a validation follow-up.
Stay inside the original scope. Identify root cause, patch minimally, and rerun the failing command.
```

## Reviewer agent usage

For large PRs or multi-area features, use explicit reviewer-agent instruction:

```text
Use relevant reviewer agents for architecture, API contract, security, tests, frontend SSR, backend NestJS/Prisma, and docs traceability. Wait for all results and consolidate findings.
```

## Local validation after AIDD/tooling changes

```powershell
npm run aidd:check
npm run aidd:assets
npm run aidd:links
```

If those scripts are not merged yet, note that clearly in the completion report.
