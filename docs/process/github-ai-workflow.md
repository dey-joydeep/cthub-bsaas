# GitHub Issue Workflow

Jira remains the planning source. GitHub Issues are the implementation source for repository work.

## Core rule

No issue, no branch. No acceptance criteria, no implementation. No linked PR, no review. No test evidence, no merge.

## Standard flow

1. Create a GitHub issue from an issue form.
2. Fill Goal, Context, Scope, Acceptance Criteria, Design Impact, and Test Plan.
3. Add type, area, priority, and status labels.
4. Mark the issue `status:ready-ai` only when it is ready for execution.
5. Start work through `scripts/agent/start-task.ps1`.
6. Open a draft PR and link the issue.
7. Let CI validate the PR and issue contract.
8. Review manually before merge.

## Bootstrap labels

```powershell
pwsh scripts/agent/bootstrap-github-governance.ps1 -Repo dey-joydeep/cthub-bsaas
```

Optionally create a GitHub Project:

```powershell
pwsh scripts/agent/bootstrap-github-governance.ps1 -Repo dey-joydeep/cthub-bsaas -CreateProject
```

## Start commands

Codex:

```powershell
pwsh scripts/agent/start-task.ps1 -Issue 123 -Agent codex -Repo dey-joydeep/cthub-bsaas
```

Antigravity:

```powershell
pwsh scripts/agent/start-task.ps1 -Issue 123 -Agent antigravity -Repo dey-joydeep/cthub-bsaas
```

## Required PR link

Use one of these in the PR body:

- `Closes #123`
- `Fixes #123`
- `Resolves #123`
- `Refs #123`

## Recommended labels

- Status: `status:triage`, `status:ready-ai`, `status:in-progress`, `status:blocked`, `status:review`, `status:done`
- Agent: `agent:codex`, `agent:antigravity`, `agent:human`
- Type: `type:feature`, `type:bug`, `type:chore`, `type:refactor`, `type:design`, `type:spike`
- Area: `area:server`, `area:web-admin`, `area:web-partner`, `area:web-customer`, `area:shared`, `area:infra`, `area:docs`
- Risk/design: `needs:hld`, `needs:lld`, `needs:test`, `needs:migration`, `needs:security-review`

## Design traceability

When a change affects architecture, user flows, DTOs, API contracts, schema, auth/security, i18n, or test strategy, update HLD/LLD documentation in the same PR or create a linked follow-up issue.
