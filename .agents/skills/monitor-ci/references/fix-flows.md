# Detailed Status Handling & Fix Flows

These flows describe possible actions, not authorization. The root `AGENTS.md` and the monitor-ci skill require specific authorization before an `APPLY`, `REJECT`, environment rerun, commit, push, dependency change, or empty-commit retry. If authorization is absent, present the exact action and evidence and stop at that boundary.

## Status Handling by Code

### fix_auto_apply_skipped

The script returns `autoApplySkipReason` in its output.

1. Report the skip reason to the user (e.g., "Auto-apply was skipped because the previous CI pipeline execution was triggered by Nx Cloud")
2. Offer to apply the fix manually — spawn UPDATE_FIX subagent with `APPLY` if user agrees
3. Record `last_cipe_url`, enter wait mode

### fix_apply_ready

- If specifically authorized, spawn UPDATE_FIX subagent with `APPLY`; otherwise report the verified fix
- Record `last_cipe_url`, enter wait mode

### fix_needs_local_verify

The script returns `verifiableTaskIds` in its output.

1. **Detect package manager:** `pnpm-lock.yaml` → `pnpm nx`, `yarn.lock` → `yarn nx`, otherwise `npx nx`
2. **Run verifiable tasks in parallel** — spawn `general` subagents for each task
3. **If all pass** → present the verification; apply with UPDATE_FIX only when authorized
4. **If any fail** → Apply Locally + Enhance Flow (see below)

### fix_needs_review

Spawn FETCH_HEAVY subagent, then analyze fix content (`suggestedFixDescription`, `suggestedFixSummary`, `taskFailureSummaries`):

- If fix looks correct → present it for authorization before applying via MCP
- If fix needs enhancement → Apply Locally + Enhance Flow
- If fix is wrong → run `ci-state-update.mjs gate --gate-type local-fix`. If not allowed, print message and exit. Otherwise → Reject + Fix From Scratch Flow

### fix_failed / no_fix

Fetch heavy failure summaries. Run `ci-state-update.mjs gate --gate-type local-fix` — if not allowed, print the message and exit. Otherwise attempt a local fix (counter already incremented by gate). If successful, present the diff and verification; commit and push only when authorized. If not, exit with the failure.

### environment_issue

1. Run `ci-state-update.mjs gate --gate-type env-rerun`. If not allowed, print message and exit.
2. Spawn UPDATE_FIX subagent with `RERUN_ENVIRONMENT_STATE`
3. Enter wait mode with `last_cipe_url` set

### self_healing_throttled

Spawn FETCH_HEAVY subagent for `selfHealingSkipMessage`.

1. **Parse throttle message** for CI Attempt URLs (regex: `/cipes/{id}`)
2. **Previous fixes** — for each URL, fetch `shortLink`; reject with UPDATE_FIX only when specifically authorized
3. **Attempt local fix**: Run `ci-state-update.mjs gate --gate-type local-fix`. If not allowed → skip to step 4. Otherwise use `failedTaskIds` and `taskFailureSummaries` for context.
4. **Fallback if local fix not possible or budget exhausted**: report the condition; an empty-commit retry needs specific authorization

### no_new_cipe

1. Report to user: no CI attempt found, suggest checking CI provider
2. If `--auto-fix-workflow` and dependency and commit permissions were explicitly granted: inspect the dependency policy, detect package manager, run the approved install, and propose the lockfile commit
3. Otherwise: exit with guidance

### cipe_no_tasks

1. Report to user: CI failed with no tasks recorded
2. Offer a one-time empty-commit retry; commit and push only when specifically authorized
3. If retry also returns `cipe_no_tasks`: exit with failure

## Fix Action Flows

### Apply via MCP

After authorization, spawn UPDATE_FIX subagent with `APPLY`. A new CI Attempt spawns automatically. No local git ops.

### Apply Locally + Enhance Flow

1. `nx-cloud apply-locally <shortLink>` (sets state to `APPLIED_LOCALLY`)
2. Enhance code to fix failing tasks
3. Run failing tasks to verify
4. If still failing → run `ci-state-update.mjs gate --gate-type local-fix`. If not allowed, report the failure and stop. Otherwise loop back to enhance.
5. If passing → present the diff and verification; commit and push only when authorized

### Reject + Fix From Scratch Flow

1. Run `ci-state-update.mjs gate --gate-type local-fix`. If not allowed, print message and exit.
2. Spawn UPDATE_FIX subagent with `REJECT`
3. Fix from scratch locally
4. Present the diff and verification; commit and push only when authorized

## Environment vs Code Failure Recognition

When any local fix path runs a task and it fails, assess whether the failure is a **code issue** or an **environment/tooling issue** before running the gate script.

**Indicators of environment/tooling failures** (non-exhaustive): command not found / binary missing, OOM / heap allocation failures, permission denied, network timeouts / DNS failures, missing system libraries, Docker/container issues, disk space exhaustion.

When detected → bail immediately without running gate (no budget consumed). Report that the failure is an environment/tooling issue, not a code bug.

**Code failures** (compilation errors, test assertion failures, lint violations, type errors) are genuine candidates for local fix attempts and proceed normally through the gate.

## Git Safety

- Stage specific files by name — `git add -A` or `git add .` risks committing the user's unrelated work-in-progress or secrets

## Commit Message Format

```bash
git commit -m "fix(<projects>): <brief description>

Failed tasks: <taskId1>, <taskId2>
Local verification: passed|enhanced|failed-pushing-to-ci"
```
