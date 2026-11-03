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
2. Use one issue for a standalone deliverable. Its body states the outcome,
   acceptance criteria, scope, and validation evidence. Add it to the private
   cthub Project with a Status. Preview a new item with:

   ```powershell
   npm run aidd:track-issue -- --repo dey-joydeep/cthub-bsaas --issue <number> --status Backlog
   ```

   Repeat with `--apply` to write. Existing field values are retained unless
   explicitly supplied. A read-only question, review, or trivial correction
   needs no new issue or board item.

3. Use a parent feature issue (Epic) with sub-issues only when at least two
   independent delivery slices need separate acceptance criteria and PRs.
   Frontend and backend may qualify, but do not split automatically by layer,
   agent, QA stage, file, chat, or internal ledger work unit. One slice normally
   has one branch and PR; an Epic does not need its own implementation branch.
4. The coordinator is the sole Project field writer after receiving evidence
   from the role owner. Verify membership and the resulting field values after
   every write. The PO owns priority decisions; only the release owner can
   decide release readiness. A Project Status is a pointer, not gate evidence.
5. Record the selected issue number in the work handoff and link it from the PR.
   Tracking alone does not authorize a new product objective. The user-requested
   or previously approved work mandate in `docs/aidd/autonomy-and-merge-policy.md`
   covers its task branch and PR work, but never a merge or deployment.

The standalone tracker accepts `--status`, `--priority`, `--size`, and `--domain`
using option names already present on the live board. It reads the existing
issue and Project before writing, and requires `--apply` for any mutation. The
read-only `npm run aidd:premerge -- <PR-number>` check verifies that every
closing issue is on this Project with an In review or Release ready status.
GitHub CLI credentials need Project access; CI does not receive Project write
credentials. Do not add the PR as a second board item for the same slice.

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
