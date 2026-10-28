# Codex CLI Operator Guide

**Status:** Current operating guide

Use this guide when operating Codex from the local repository.

The shared [AI-driven development life cycle](development-lifecycle.md) assigns bulk PO-to-release preparation to Antigravity by default and independent review and all security checks to Codex. Select review effort and model capability by risk; critical product decisions require an independent Codex product-spec review, and critical security decisions require two separately tasked Codex assessments.

## Start session

From the repository root:

```text
codex
```

From a parent directory or another workspace:

```text
codex --cd ./cthub-bsaas
```

Linux or WSL example:

```bash
cd ~/workspace/cthub-bsaas
codex
```

First prompt for meaningful work:

```text
Use AIDD mode. This is a new task.
Read AGENTS.md, the nearest scoped AGENTS.md, and docs/aidd/README.md before planning or editing.
Do not edit yet. First classify the task, identify source-of-truth docs, impacted files, validation commands, and risks.
```

## Useful slash commands

| Command   | Use                                                                        |
| --------- | -------------------------------------------------------------------------- |
| `/status` | Check current session and workspace status.                                |
| `/diff`   | Review local changes before continuing.                                    |
| `/review` | Ask Codex to review current changes.                                       |
| `/skills` | Inspect available skills and confirm whether a task-specific skill exists. |
| `/agent`  | Inspect or switch the active agent thread.                                 |
| `/hooks`  | Inspect project and user hooks.                                            |

## Repo-shipped agents

This branch ships these repo agents:

- reviewer agents: product specification, architecture, API contract, security, adversarial security, tests, Angular SSR, NestJS or Prisma, and docs traceability
- implementation helpers: implementation planner, backend implementer, frontend implementer, and docs or contract updater
- CI helper: `ci-monitor-subagent`

Use explicit prompts to invoke them for planning, implementation, or review tasks.

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
Use relevant independent Codex reviewer agents. Route security checks to Codex. Do not edit files during review.
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

## Fresh worktree bootstrap

Fresh Codex environments use the repo bootstrap command from `.codex/environments/environment.toml`.

The bootstrap currently:

- verifies the repository root
- reports the Node version
- runs `npm install` only when `node_modules` is missing

Dry-run validation:

```text
node .codex/environments/setup.mjs --dry-run
```

## Local validation after AIDD/tooling changes

Use the validation commands that exist in the checked-out branch and match the PR scope. When the AIDD verification scripts are not yet present in that branch, report that they are unavailable instead of running them.

For documentation-only changes, use the narrowest existing validation available and document anything not run.
