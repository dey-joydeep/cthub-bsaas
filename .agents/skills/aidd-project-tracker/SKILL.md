---
name: aidd-project-tracker
description: >-
  Find and reuse GitHub tracking for an AIDD work item. Use one issue for a
  standalone delivery slice. For an explicitly multi-slice outcome, preview
  and initialize a GitHub Epic with sub-issues and project fields.
---

# AIDD Project Tracker

## Choose the tracking unit

1. Search open and closed GitHub issues for the requested outcome and inspect
   the project board. Reuse a matching issue or Epic.
2. Use one issue for a standalone change. Its body should state the outcome,
   acceptance criteria, scope, and validation evidence required. A read-only
   question, review, or trivial correction needs no new issue.
3. Use an Epic only when at least two independent delivery slices need their own
   issue, owner, and acceptance criteria. Do not create an Epic per agent, role,
   file, or chat.
4. Record the selected issue number in the work handoff and link it from the PR
   when a PR is created. Tracking does not authorize a branch, commit, merge, or
   deployment.

## New Epic initializer

The initializer is for a **new multi-slice Epic**. It uses the GitHub CLI and
the configured project board. Node.js and authenticated `gh` with `repo` and
`project` scopes are required. `--apply` is the explicit write switch; without
it, the script validates inputs and makes no GitHub changes.

Prepare two files in a temporary ignored location inside the repository:

`epic-body.md` must describe the objective, scope, non-goals, and rollback or
recovery approach. Do not include an `Epic Tracker` section; the script manages
that section.

`sub-issues.json` must contain at least two independent slices:

```json
[
  {
    "title": "Phase 1: Define the contract",
    "body": "Acceptance criteria and validation for this slice.",
    "status": "Backlog",
    "priority": "P1",
    "size": "M",
    "domain": "Core",
    "estimate": 3,
    "start": "2026-10-26",
    "end": "2026-10-30"
  },
  {
    "title": "Phase 2: Deliver the contract",
    "body": "Acceptance criteria and validation for this slice.",
    "status": "Backlog",
    "priority": "P1",
    "size": "M",
    "domain": "Core",
    "estimate": 3,
    "start": "2026-10-31",
    "end": "2026-11-04"
  }
]
```

Select field values that exist on the target board. Dates are ISO `YYYY-MM-DD`
values, and each end date must be on or after its start date.

Preview on Windows:

```powershell
pwsh .agents/skills/aidd-project-tracker/scripts/init-tracker.ps1 `
  --epic-title '[EPIC] Outcome' `
  --repo 'dey-joydeep/cthub-bsaas' `
  --epic-body-file epic-body.md `
  --sub-issues-file sub-issues.json
```

On macOS or Linux, use `bash .../init-tracker.sh` with the same options. After
reviewing the inputs and checking that no existing issue covers the outcome,
repeat with `--apply`. The script discovers board field and option IDs at run
time, creates or reuses issues bearing its stable marker, links each child,
sets project fields, and verifies each write. On partial failure, correct the
cause and rerun with identical inputs. The script reuses marked items instead
of duplicating them. An existing unmarked issue with the same title stops the
script for manual reconciliation.

If a run stops after creating an Epic, the error output and GitHub issue list
identify the created issue. The same title and inputs locate its marker on
retry; `--epic-number <number>` can explicitly select it. Do not delete or
recreate partial tracking until its state has been inspected.

The Epic itself is added to the board. Each sub-issue receives Status,
Priority, Size, Estimate, Domain, Start date, and End date. The Epic checklist
is managed between `aidd-checklist` markers and verified after the update.

## Validation without GitHub writes

```powershell
node --check .agents/skills/aidd-project-tracker/scripts/init-tracker.mjs
pwsh .agents/skills/aidd-project-tracker/scripts/init-tracker.ps1 --epic-title '[EPIC] Dry run' --repo dey-joydeep/cthub-bsaas --epic-body-file epic-body.md --sub-issues-file sub-issues.json
```

Do not run `--apply` as a test. The initializer performs real GitHub writes in
that mode.
