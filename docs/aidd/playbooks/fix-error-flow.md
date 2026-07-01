# Fix Error Flow Playbook

Use this playbook when asking Codex to correct a failing command or defect.

## Classify the request first

| Case                                         | Required flow            |
| -------------------------------------------- | ------------------------ |
| Separate correction request                  | Full AIDD new-task flow. |
| Validation failure from the same active task | Continuation path.       |

## Operator prompt for a separate correction request

```text
Follow the repository AIDD workflow. This is a new correction task.

Failure input:
<paste the failing command and relevant output>

Read AGENTS.md, the nearest scoped AGENTS.md, docs/aidd/README.md, and relevant source/spec/test files.
Do not edit yet. First identify root cause, affected scope, source-of-truth docs, minimal fix plan, validation commands, and risks.
```

## Operator prompt for a continuation correction

```text
This is a continuation correction inside the current task.
The failing validation command is:
<paste command and relevant output>

Stay inside the original scope. Patch only the immediate cause, do not broaden the change, and rerun the failed validation.
```

## Required Codex behavior

- Do not weaken tests, lint rules, type safety, coverage thresholds, guards, validation, or contracts.
- Prefer a regression test for real defects.
- If code contradicts docs, stop and ask whether to correct code or docs.
- Use the narrowest Nx or repo validation command that proves the fix.
- Report the exact command that failed and the exact command rerun.
