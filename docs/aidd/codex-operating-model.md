# Codex AIDD Operating Model

**Status:** Current operating guide

This document defines how OpenAI Codex is used for AI-driven development in this repository.

## Scope

Codex is the primary AIDD agent for this project. New AIDD process changes should be expressed first through:

- `AGENTS.md` and nested `AGENTS.md` files
- `docs/aidd/*`
- `.codex/prompts/*`
- `.codex/config.toml` only when project-level Codex configuration is required

Do not add other assistant-specific instruction files as part of Codex AIDD setup unless explicitly requested.

## Default AIDD rule

AIDD is the default workflow for every new task, including a new error-fix request.

A new task is any request that starts a separate unit of work, such as:

- fixing an error discovered outside the current Codex task;
- implementing a new feature or implementation slice;
- reviewing a PR or branch;
- updating production docs or API contracts;
- adding tests for a feature or defect.

A continuation fix is different. When Codex is already inside an active task and a lint/test/build/type-check error appears from that same change, Codex may use the lighter continuation path: identify the immediate cause, patch minimally, rerun the failed validation, and preserve the original task trace.

Even for continuation fixes, Codex must not skip safety rules, broaden scope, weaken tests, or bypass design/spec alignment when behavior or contracts change.

## Repository source of truth

The project source of truth remains the repository itself. Use the most specific current source:

1. Product/user story documents under `docs/us`.
2. Production documentation standard under `docs/quality-standards/production-documentation-standard.md`.
3. HLD/LLD/specification documents under `docs/specs`.
4. API contracts:
   - `docs/specs/auth/API/openapi.yaml`
   - `docs/specs/salon-owner/API/openapi.yaml`
   - `docs/specs/project-wide/API/openapi.yaml`
5. Project-wide implementation sequencing under `docs/specs/project-wide/IMPLEMENTATION/implementation-slicing.md`.
6. Nx project configuration under `nx.json`, `project.json`, and package scripts.
7. Implementation under `apps` and `libs`.
8. Tests beside source or under project test directories.

Codex should not rely on stale memory when the repository contains the answer.

## Standard AIDD flow

Use this flow for all new tasks:

```text
Requirement / issue
  -> classify as new task or continuation fix
  -> read root AGENTS.md, nearest scoped AGENTS.md, and docs/aidd/README.md
  -> inspect existing docs and code
  -> identify impacted apps/libs/contracts/schema/tests/docs
  -> plan the smallest safe change using the project-wide implementation slicing plan when applicable
  -> update or confirm FRD/FNRD/HLD/LLD/API/validation/web/test alignment when behavior or contracts change
  -> implement or document
  -> add or update tests when behavior changes
  -> run targeted Nx or documentation validation
  -> summarize result and risks
```

## Task classes

| Task class             | Codex behavior                                                                                                  |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| Documentation-only     | Update docs, keep examples consistent, no code changes unless requested.                                        |
| Design/spec            | Update HLD/LLD/API/test-plan first; avoid implementation changes unless requested.                              |
| New bug/error fix      | Treat as a new AIDD task: inspect docs/code, identify scope, patch minimally, add regression test where useful. |
| Continuation fix       | Patch the validation error produced inside the current active task; preserve the original AIDD trace.           |
| Feature implementation | Work from user story plus FRD/FNRD/HLD/LLD/API/validation/test docs; update missing specs before code changes.  |
| Refactor               | Preserve behavior, keep public API stable, run tests around touched projects.                                   |
| Review                 | Report correctness, security, architecture, tests, and maintainability risks before proposing changes.          |

## Design documentation expectations

HLD documents should explain the system vision, major modules, boundaries, key flows, non-functional requirements, risks, and explicit decisions. They must not leave implementation-blocking open questions.

LLD documents should explain concrete implementation details: components/classes/services, DTOs, API contracts, schema impact, validation, errors, security handling, sequence/state flows, and test strategy.

Implementation changes must keep HLD, LLD, API contracts, and tests traceable.

## Completion report format

Codex responses and PR descriptions should include:

- Summary of changes.
- Files changed.
- Validation commands run and result.
- Commands not run and reason.
- Design/spec impact.
- Risks and follow-ups.

## Local workspace caution

GitHub-side automation can only see committed GitHub content. The developer may have uncommitted local files under `E:\workspace\cthub-bsaas`. Before merging, compare the PR with the local workspace.
