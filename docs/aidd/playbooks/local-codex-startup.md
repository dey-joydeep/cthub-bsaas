# Local Codex Startup Playbook

Use this playbook when starting a Codex session in the local repository.

## Start from the repository root

```powershell
cd E:\workspace\cthub-bsaas
codex
```

## First prompt for a new session

```text
Use AIDD mode.
Before doing work, summarize the active repository instructions you loaded.
Read AGENTS.md, the nearest scoped AGENTS.md for the requested area, and docs/aidd/README.md.
Do not edit yet. Confirm the task classification, source-of-truth docs, impacted areas, validation commands, and risks.
```

## Expected Codex response

Codex should mention:

- root `AGENTS.md`;
- nearest scoped `AGENTS.md` when a scoped area is involved;
- `docs/aidd/README.md`;
- relevant production documentation standards for docs/spec work;
- affected apps, libs, docs, tests, and commands.

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

```powershell
npm run aidd:check
npm run aidd:assets
npm run aidd:links
```

If a validation command is unavailable because a related PR is not merged yet, Codex must report that clearly instead of claiming success.
