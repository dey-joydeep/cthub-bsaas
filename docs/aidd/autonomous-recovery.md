# AIDD Autonomous Recovery

**Status:** Current local protocol

Long-running and multi-agent work needs a recoverable record before dispatch. The coordinator creates one task ledger and bounded work units. Each unit has one owner, explicit paths, dependencies, and acceptance criteria. Agents with command access checkpoint after each reviewable increment; for agents without it, the coordinator records their structured handoff immediately. A failed or interrupted run keeps its checkpoint but never becomes complete by inference.

The live ledger is local to one checkout and branch at `tmp/aidd-ledger/<task-id>/` and is ignored by Git. It contains an immutable task manifest, immutable unit definitions, and append-only events. Event files are published atomically. Parallel agents may update separate units. Two writers racing on the same unit create a detectable fork and stop recovery rather than silently overwriting evidence. Keep report files in `tmp/` as well; the command copies each report into an event. The CLI rejects the ledger after a branch switch; use the original branch and checkout to resume.

For durable handoff between checkouts, export a compact, trackable snapshot to `docs/status/aidd/<task-id>.json`. The snapshot records the issue, branch, unit definitions, last checkpoints, source fingerprints, and current status. It is a recovery seed, not a substitute for the full local event history. Review the snapshot for secrets before committing it with the work item. Repository rules still control commits and pushes.

Because this repository is private, the coordinator can also publish the snapshot to one checkpoint comment on its private GitHub issue. This preserves process state across machines even before a code commit. The remote command requires an authenticated `gh` CLI account with access to this private repository; it refuses a public repository. It stores no token in the ledger. The issue comment contains the task, branch, head, unit statuses, and a digest-checked snapshot payload. Only the same GitHub identity may update that comment, and a changed remote checkpoint cannot be overwritten without reconciliation. Keep secrets and raw source out of checkpoint reports because the snapshot is readable by repository members with issue access.

The authorized source checkpoint uses a separate private Git ref, `refs/aidd/checkpoints/<task-id>`. It records the current nonignored source tree, including modified, deleted, and new files, in a commit whose first parent is the current task-branch HEAD. The command uses a temporary Git index; it does not stage files in the normal index or move the task branch. It rejects sensitive file paths, common token and private-key patterns, public repositories, and a mismatched `origin`. A checkpoint is a recovery copy, not a reviewed or releasable branch commit. Ignored files, including local secrets and build output, are deliberately excluded.

## Start and checkpoint

Select the existing tracking issue first. Use a stable lowercase task ID, such as `issue-67`. From the repository root:

```powershell
npm run aidd:ledger -- init --task issue-67 --goal "Deliver the approved AIDD slice" --issue 67 --base main
npm run aidd:ledger -- add --task issue-67 --unit implementation --kind implementation --owner agy-senior --paths docs/aidd,scripts/aidd --acceptance "Lifecycle and CLI behavior are validated"
npm run aidd:ledger -- start --task issue-67 --unit implementation
```

For a dependent QA or Codex review unit, pass `--depends implementation`. Give each concurrent agent a different unit ID and path boundary. The coordinator remains accountable for the complete issue and handoff.

A report is a JSON file with this shape:

```json
{
  "summary": "Implemented the bounded slice and checked the affected paths.",
  "remainingPaths": [],
  "evidence": ["docs/aidd/development-lifecycle.md"],
  "commands": [{ "command": "npm run aidd:check", "exitCode": 0 }],
  "findings": []
}
```

Use `checkpoint` while work remains and `complete` only when the unit's acceptance criteria are met:

```powershell
npm run aidd:ledger -- checkpoint --task issue-67 --unit implementation --report tmp/implementation-report.json
npm run aidd:ledger -- complete --task issue-67 --unit implementation --report tmp/implementation-report.json
```

For a final Codex review unit (`--kind review`), include `"review": { "reviewer": "<unit owner>", "reviewedBase": "<full merge-base SHA>", "reviewedBaseTip": "<full target-branch SHA>", "reviewedHead": "<full HEAD SHA>", "scope": "whole-pr", "verdict": "pass" }`. A final whole-PR review requires a clean committed tree and paths covering every changed file. The reviewer cannot own an implementation unit on which the review depends. Finding-closure reviews use `--kind review-closure` and `"scope": "finding-closure"`; they do not replace the final whole-PR review.

## Interrupt and resume

If one agent is interrupted, the coordinator records it with `interrupt --task <id> --unit <id> --reason <text>`. If the coordinator session or all dispatched agents were interrupted, first make sure the old writers have stopped, then run:

```powershell
npm run aidd:ledger -- recover --task issue-67
npm run aidd:ledger -- status --task issue-67
```

`recover` marks running units interrupted once, retains their last checkpoint, and prints `readyUnits`. Restart a ready unit with `start`; give its owner the preserved checkpoint and ask it to verify the source before continuing. Do not redispatch completed units. Recovery is idempotent when no new work occurred.

At a meaningful phase handoff, before the final whole-PR review, export the current state:

```powershell
npm run aidd:ledger -- export --task issue-67
```

Commit the generated `docs/status/aidd/issue-67.json` only when commit authorization exists. In a fresh checkout with the same branch and committed snapshot, restore local working state with `npm run aidd:ledger -- import --task issue-67`, then inspect `status` and resume `readyUnits`. Import preserves completed units only when their recorded source still matches; unfinished units return as interrupted. It refuses to overwrite an existing local ledger. Export refuses to overwrite a snapshot changed outside the ledger and is blocked after a completed final whole-PR review because rewriting a tracked snapshot would dirty the reviewed candidate. Record final review evidence in the PR after that freeze.

To make a checkpoint available from another machine before a commit, preview and explicitly publish it to the private issue:

```powershell
npm run aidd:ledger -- publish --task issue-67 --mode preview
npm run aidd:ledger -- publish --task issue-67 --mode apply
```

`preview` reads the issue and reports whether it would create or update the comment; `apply` performs and verifies the write. Publish after each checkpoint that must survive loss of this checkout. `status` reports `remoteCurrent: false` when local events have advanced beyond the last published snapshot. On another machine, clone the private repository, obtain the task branch and the recovery CLI, install workspace dependencies, authenticate `gh`, then run `npm run aidd:ledger -- restore --task issue-67 --issue 67`. Restore reads the private issue comment, verifies its digest, writes the tracked snapshot, and rebuilds the local ledger. It refuses to overwrite an existing local ledger or a locally modified snapshot.

For full source recovery, publish a private source checkpoint after exporting the process snapshot. `preview` lists every path that differs from the task branch HEAD; inspect it for confidential data before `apply`:

```powershell
npm run aidd:source-checkpoint -- preview issue-67
npm run aidd:source-checkpoint -- apply issue-67
```

On a fresh machine, clone the private repository, then fetch and restore the task source. The first parent of the checkpoint is the original task-branch HEAD, even when that branch was never pushed. Run these in the fresh clone, replacing the task ID and branch name:

```powershell
git fetch origin refs/aidd/checkpoints/issue-67
git switch -c chore/aidd-lifecycle-overhaul 'FETCH_HEAD^1'
git restore --source FETCH_HEAD --staged --worktree -- .
git reset
npm ci
npm run aidd:ledger -- import --task issue-67
npm run aidd:ledger -- status --task issue-67
```

Use a clean fresh clone for this sequence; do not apply it over existing local edits. The restored source is uncommitted again. Re-run validation because the local environment and base branch may have changed. A later source checkpoint is a fast-forward update of the dedicated ref; an intervening writer causes the push to fail rather than overwriting it. Source checkpoints remain private Git objects and require normal repository access controls and retention policy.

The ledger fingerprints the tracked and untracked files inside each unit's path boundary. For a whole-PR review assigned to `.`, it fingerprints the PR's changed paths plus current uncommitted changes, so status checks do not scan unrelated repository files. A changed source marks a completed unit stale; stale dependencies also invalidate downstream completion. QA, review, and verification evidence also includes the committed head, merge base, and target-branch tip, so a new commit or changed target invalidates those gates. `sourceCurrent: false` marks a checkpoint that can inform investigation but cannot prove current work. Revalidate and complete the affected unit on the new source. If the event chain is malformed or forked, the CLI stops; inspect it instead of deleting evidence or guessing which writer won.

The live ledger survives interrupted agents and sessions while the checkout and its ignored `tmp/` directory exist. A committed snapshot or a published private-issue checkpoint allows process recovery after that local directory is lost. An uncommitted, unpublished export remains local. A private-issue snapshot alone does not make an unpushed task branch or uncommitted source available on another machine. Pair it with the private source checkpoint for full recovery of nonignored source; ignored local files remain outside that promise. Keep product decisions and release evidence in the issue, PR, and normal specification sources of truth.
