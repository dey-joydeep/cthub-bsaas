---
name: aidd-project-tracker
description: >-
  Initializes a GitHub Epic with sub-issues and fully populates the GitHub
  Project board (projects/1) for any new trackable task — feature, bug, doc,
  migration, spike, or chore. USE THIS SKILL as the mandatory first step before
  writing any code or documentation for a new work item. Trigger words: "new
  feature", "new bug", "new epic", "start a task", "initialize tracker",
  "scaffold issue", "create epic".
---

# AIDD Project Tracker

## Overview

This skill automates the complete GitHub project board initialization workflow
for every new trackable task. It creates a structured Epic issue with an
acceptance criteria body, creates sub-issues linked to it using the GitHub
GraphQL `addSubIssue` mutation, adds all items to the project board, and
populates every custom field (Status, Priority, Size, Estimate, Domain, Start
date, End date).

All steps are executed via the `gh` CLI and GitHub GraphQL API. No browser
interaction is required. The skill is device-independent and works on Windows
(pwsh), macOS (zsh/bash), and Linux (bash).

## Prerequisites

- `gh` CLI authenticated with `repo` and `project` scopes.
  - Verify with: `gh auth status`
  - Add scopes if missing: `gh auth refresh -s project`
- Project board number: **1**, owner: **dey-joydeep**
- Project ID (hardcoded): `PVT_kwHOALP8fs4BCwcr`

## Workflow

### Step 1 — Gather inputs

Collect the following before running any script:

| Input        | Description                                                                            | Example                   |
| ------------ | -------------------------------------------------------------------------------------- | ------------------------- |
| `EPIC_TITLE` | Short title for the Epic                                                               | `[EPIC] Auth Redesign`    |
| `EPIC_BODY`  | Markdown body with Objective, Scope, Rollback, and Epic Tracker checklist              | See template below        |
| `SUB_ISSUES` | Array of sub-issue objects (title, body, domain, priority, size, estimate, start, end) | See schema below          |
| `REPO`       | `owner/repo` slug                                                                      | `dey-joydeep/cthub-bsaas` |

**Epic body template:**

```markdown
**Objective/Business Value:**
[Why this work matters]

**Scope & Non-Goals:**

- Included: [what is in scope]
- Excluded: [what is explicitly out of scope]

**Rollback Strategy:**
[How to revert if something goes critical]

### Epic Tracker

- [ ] #PLACEHOLDER — will be updated after sub-issues are created
```

**Sub-issue schema (repeat for each phase/slice):**

```json
{
  "title": "Phase N: Short description",
  "body": "**Domain:** X\n\n**Acceptance Criteria:**\n- [ ] Item",
  "domain": "DevOps | Core | Backend | Frontend | QA",
  "priority": "P0 | P1 | P2",
  "size": "XS | S | M | L | XL",
  "estimate": 1,
  "start": "YYYY-MM-DD",
  "end": "YYYY-MM-DD"
}
```

### Step 2 — Run the initialization script

Execute the cross-platform script with all inputs:

```powershell
# Windows (pwsh)
.agents/skills/aidd-project-tracker/scripts/init-tracker.ps1 `
  -EpicTitle "..." `
  -Repo "dey-joydeep/cthub-bsaas" `
  -SubIssuesJson (Get-Content sub-issues.json -Raw)
```

```bash
# macOS/Linux (bash)
bash .agents/skills/aidd-project-tracker/scripts/init-tracker.sh \
  --epic-title "..." \
  --repo "dey-joydeep/cthub-bsaas" \
  --sub-issues-json "$(cat sub-issues.json)"
```

### Step 3 — Verify

After the script completes:

1. Open https://github.com/users/dey-joydeep/projects/1/views/1
2. Confirm all sub-issues appear with Status, Priority, Size, Estimate, Domain,
   Start date, and End date populated.
3. Open the Epic issue and confirm the Epic Tracker checklist is updated with
   the real issue numbers.
4. Confirm Parent issue column shows the Epic number for all sub-issues.

### Step 4 — Proceed to implementation

Only after Step 3 is confirmed, begin writing code or documentation.

## Field Reference

These are the stable GitHub Project field IDs for `projects/1`. Update this
section if fields are ever deleted and recreated.

```
Project ID     : PVT_kwHOALP8fs4BCwcr
Status         : PVTSSF_lAHOALP8fs4BCwcrzg04ApY
  Backlog      : f75ad846
  Ready        : 08afe404
  In progress  : 47fc9ee4
  In review    : 4cc61d42
  Done         : 98236657
Priority       : PVTSSF_lAHOALP8fs4BCwcrzg04A1A
  P0           : 79628723
  P1           : 0a877460
  P2           : da944a9c
Size           : PVTSSF_lAHOALP8fs4BCwcrzg04A1E
  XS           : eff732af
  S            : 9592a5a3
  M            : 9728cbdc
  L            : c53df028
  XL           : 7b141a16
Estimate       : PVTF_lAHOALP8fs4BCwcrzg04A1I
Start date     : PVTF_lAHOALP8fs4BCwcrzg04A1Q
End date       : PVTF_lAHOALP8fs4BCwcrzg04A1U
Domain         : PVTSSF_lAHOALP8fs4BCwcrzhWdrWU
  DevOps       : f9b2cc13
  Core         : ce8a9745
  Backend      : b5a2cdae
  Frontend     : 712936d5
  QA           : 03be41e2
```

## Common Mistakes

1. **Missing `project` scope:** If `gh project item-edit` fails with a 401 or
   permission error, run `gh auth refresh -s project` and retry.
2. **`addSubIssue` mutation fails:** The issue node IDs must be the GraphQL
   global IDs (format `I_kwDO...`), NOT the integer issue numbers. Always fetch
   them with `gh issue view <n> --json id`.
3. **Dates not showing on board:** GitHub Project date fields require ISO-8601
   format `YYYY-MM-DD`. Do not use slashes or other separators.
