# AIDD Autonomy and Merge Policy

**Status:** Current operating policy

## Work mandate and Git authority

A user request to execute a task, or a previously accepted roadmap item with a recorded owner decision, outcome, and acceptance criteria, authorizes the coordinator to carry that work item through its task branch and PR. The PO may research and propose additional work, but an agent-created issue, Project status, or draft specification alone does not authorize a new product objective. Link the mandate in the issue or PR before delivery work. Read-only discovery and a proposed plan may proceed without a delivery mandate.

Within that mandate, the coordinator may create the issue and Project item, create a short-lived task branch and an approved-parent worktree, assign bounded units, commit and push reviewable increments, open or update the PR, and repair CI and review findings. These actions do not require a prompt per commit. Use one Git writer per branch, inspect status and staged paths before committing, run the narrowest meaningful validation, and keep commits within the issue's accepted scope. Use the actual authenticated GitHub actor; a PO, QA, or Dev bot name is valid only when that App performed the write through the broker. Once the task-scoped broker is activated, the owner approves an exact task scope once and the role caller receives single-use grants within it. The agent cannot approve or expand its own mandate from mutable GitHub text. This standing Git authority does not expose App keys, activate the deployed broker, or authorize a PR merge.

For bot-owned GitHub actions, use the [registered identity and broker route](github-app-identities.md). Check the broker identity before the write and the GitHub actor afterward. If the activated broker is unavailable or an action is denied, record the blocked action and resume independent work; never silently substitute the owner's `gh` login. The local commit author string is not proof of the remote GitHub actor. Same-user role tokens give attribution but cannot prove independent PO or QA judgment.

No task mandate authorizes a direct push to `main` or a release branch, a force push, a release tag, deployment, deletion of another writer's work, or a PR merge. A material change to the accepted outcome, tenant or security boundary, public contract, production data, budget, or release risk requires a new decision. The user can narrow or revoke the mandate at any time.

## Readiness and merge decision

The release agent prepares a short go/no-go report for the exact PR head and target base. It must include acceptance criteria and QA result, current-head CI, independent Codex whole-PR review, applicable security assessments, open finding dispositions, migration and rollback impact, and the read-only `npm run aidd:premerge -- <PR-number>` result. A passing check or Codex comment is evidence, not a GitHub approving review or a human merge decision. When the head or base changes, refresh the affected evidence and report.

The user alone decides whether to merge. A clear instruction in chat or an attributable GitHub comment naming the PR is sufficient when it refers to the current candidate; if the head changes before execution, ask again. The user may merge in GitHub or instruct an agent to perform the exact squash merge. Agents must not enable auto-merge or queue a merge without that instruction. Release and deployment need their own explicit authorization. Until the user responds, leave the PR open and marked ready for owner decision.

The current private GitHub Free repository cannot require branch protection or rulesets. CI and the local premerge command report readiness but cannot stop a maintainer or a general write credential from merging or pushing. Do not invent a CI "human approval" check based on editable PR text or agent comments; it would not enforce the decision. The broker rejects `main` and release-branch writes through its own allowlist, but it does not control other credentials. The release agent and human owner enforce the merge boundary until a plan with server-side protections is available. Do not label a PR "approved" merely because CI passed or an agent commented.

## When the owner is away

Aim for two planned human decision points: initial product direction when the outcome is ambiguous, and the final merge or release decision. Ask sooner only when the next safe action depends on an owner-only choice or credential. Before asking, complete independent work and present one concise question with the decision, options, recommendation, impact, and exact link or commit. Do not ask for routine branch creation, commits, pushes, PR updates, CI fixes, or review replies within the work mandate.

For a trackable item, record an owner-dependent question in its issue with `Waiting for owner`, the blocked unit, alternatives, recommendation, and the specific action withheld. Move the Project item to the closest existing status and leave the waiting reason in the issue; do not invent a board status. Checkpoint the ledger and source when recovery across machines matters. Continue other ready units or work items without crossing the blocked decision. If no independent work remains, stop the agent run and resume from the issue and ledger when the owner answers. Silence, elapsed time, and repeated reminders are not approval. An owner answer that changes scope must be reflected in acceptance criteria before implementation resumes.

Use this compact issue record so another session can recover the decision:

```text
Waiting for owner
Blocked unit: <unit or PR>
Decision: <one question>
Options: <short choices and impact>
Recommendation: <choice and reason>
Work completed: <commit/checkpoint and validation links>
Withheld action: <exact action>
Resume when: <owner answer or access change>
```
