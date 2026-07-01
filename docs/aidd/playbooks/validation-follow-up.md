# Validation Follow-up Playbook

Use this playbook when a branch or pull request needs follow-up after a local command or remote check.

## Operator prompt

```text
Follow the repository AIDD workflow. This is a validation follow-up task.

Input:
<paste the command, branch, or relevant output>

Read AGENTS.md, every scoped AGENTS.md file required for the affected area, docs/aidd/README.md, and relevant source/spec/test files.
Do not edit yet. First summarize the command, likely cause, impacted scope, validation plan, and risks.
```

## Required Codex behavior

- Prefer the smallest correction that addresses the real cause.
- Keep tests, lint rules, type safety, and coverage thresholds intact.
- If the issue is environment-only, document the evidence and avoid code changes.
- Load all layered scoped instructions when the affected area requires more than one file.
- Rerun the relevant command locally when possible.

## Completion format

```text
Input analyzed:
Likely cause:
Files changed:
Validation run:
Validation not run:
Remaining risk:
```
