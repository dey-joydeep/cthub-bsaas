# New Task Flow Playbook

Use this playbook for every new Codex task, including a fresh error-fix request.

The shared [development life cycle](../development-lifecycle.md) determines the product stage, role owner, and gates. Search for an existing issue before creating tracking. A new task does not automatically require a new Epic.

## Operator prompt

```text
Follow the repository AIDD workflow. This is a new task.

Goal:
<describe the requested work>

Read first:
- AGENTS.md
- every scoped AGENTS.md required for the touched areas
- docs/aidd/README.md
- relevant docs/us, docs/specs, docs/quality-standards, and existing implementation files

Do not edit yet. First produce:
1. task classification
2. source-of-truth docs and files
3. impacted apps, libs, contracts, schema, tests, and docs
4. implementation or documentation plan
5. validation commands
6. risks, assumptions, and open questions
7. existing issue or proposed standalone issue/Epic decision when the work is trackable
```

## Required Codex behavior

- Treat short requests such as `fix this error` as new tasks unless they are continuation fixes inside an already-running task.
- Inspect before editing.
- Prefer the smallest safe change.
- Load all required scoped instruction files when an area has layered guidance, such as `libs/server/**` plus `libs/server/features/auth/**`.
- Use Nx commands for project tasks instead of direct tool invocations when Nx targets exist.
- Keep FRD/FNRD/HLD/LLD/API/VALIDATION/WEB/TEST alignment when behavior or contracts change.
- Report validation honestly.
- When implementing for a PR, hand the result to an independent Codex reviewer; route every security check to Codex.
- For long-running or multi-agent work, initialize the [AIDD ledger](../autonomous-recovery.md) and bounded units before dispatch; checkpoint progress after each reviewable increment.

## Completion format

```text
Summary:
Files changed:
Validation run:
Validation not run:
Design/spec impact:
Risks and follow-ups:
```
