# Local Codex Startup Playbook

Use this playbook when starting a Codex session in the local repository.

## Start from the repository root

```powershell
codex --cd .
```

If starting outside the repo root, use the repository path supported by `AGENTS.md`:

```powershell
codex --cd E:/workspace/cthub-bsaas
```

```bash
codex --cd ~/workspace/cthub-bsaas
```

## First prompt for a new session

```text
Follow the repository AIDD workflow for this session.
Before doing work, summarize the active repository instructions you loaded.
Read AGENTS.md, every scoped AGENTS.md file required for the requested area, and docs/aidd/README.md.
Do not edit yet. Confirm the task classification, source-of-truth docs, impacted areas, validation commands, and risks.
```

## Expected Codex response

Codex should mention:

- root `AGENTS.md`;
- every scoped `AGENTS.md` required when a layered scoped area is involved;
- `docs/aidd/README.md`;
- relevant production documentation standards for docs/spec work;
- affected apps, libs, docs, tests, and commands.

For a resumed long-running or multi-agent task, identify its task ID and read [Autonomous Recovery](../autonomous-recovery.md). If the prior writers have stopped, run `npm run aidd:ledger -- recover --task <id>` before dispatching new work. Use the returned `readyUnits` and preserved checkpoints; do not treat a still-running or stale unit as complete.

## Useful commands inside Codex

```text
/status
/diff
/review
/skills
/agent
/permissions
```

## Local validation after setup changes

Run the commands that exist on the checked-out branch. On this branch, the baseline checks are:

```powershell
npx prettier --check "docs/aidd/**/*.md" ".codex/prompts/**/*.md"
git diff --check
```

Only if the checked-out branch defines the AIDD verification scripts, run them too:

```powershell
npm run aidd:check
npm run aidd:assets
npm run aidd:links
```

If those scripts are absent on the branch, skip them and report that clearly instead of claiming success.
