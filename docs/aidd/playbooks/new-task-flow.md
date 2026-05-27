# New Task Flow Playbook

Use this playbook for every new Codex task, including a fresh error-fix request.

## Operator prompt

```text
Use AIDD mode. This is a new task.

Goal:
<describe the requested work>

Read first:
- AGENTS.md
- nearest scoped AGENTS.md
- docs/aidd/README.md
- relevant docs/us, docs/specs, docs/quality-standards, and existing implementation files

Do not edit yet. First produce:
1. task classification
2. source-of-truth docs and files
3. impacted apps, libs, contracts, schema, tests, and docs
4. implementation or documentation plan
5. validation commands
6. risks, assumptions, and open questions
```

## Required Codex behavior

- Treat short requests such as `fix this error` as new tasks unless they are continuation fixes inside an already-running task.
- Inspect before editing.
- Prefer the smallest safe change.
- Keep FRD/FNRD/HLD/LLD/API/VALIDATION/WEB/TEST alignment when behavior or contracts change.
- Report validation honestly.

## Completion format

```text
Summary:
Files changed:
Validation run:
Validation not run:
Design/spec impact:
Risks and follow-ups:
```
