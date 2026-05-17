# Codex AIDD Operating Model

This document defines how OpenAI Codex is used for AI-driven development in this repository.

## Scope

Codex is the primary AIDD agent for this project. Other assistant-specific files may exist historically, but new AIDD process changes should be expressed first through:

- `AGENTS.md`
- `docs/aidd/*`
- `.codex/prompts/*`

Do not add or update Copilot, Windsurf, Cursor, Claude, Gemini, or other provider-specific instruction files as part of Codex AIDD setup unless explicitly requested.

## Repository source of truth

The project source of truth remains the repository itself:

1. Product/user story documents under `docs/us`.
2. HLD/LLD/specification documents under `docs/specs`.
3. API contracts and OpenAPI files under `docs/specs`.
4. Nx project configuration under `nx.json`, `project.json`, and package scripts.
5. Implementation under `apps` and `libs`.
6. Tests beside source or under project test directories.

Codex should not rely on stale memory when the repository contains the answer.

## Standard AIDD flow

Use this flow for feature work and meaningful bug fixes:

```text
Requirement / issue
  -> inspect existing docs and code
  -> identify impacted apps/libs/contracts/schema/tests
  -> plan the smallest safe change
  -> update or confirm HLD/LLD/API/test-plan alignment
  -> implement
  -> add or update tests
  -> run targeted Nx validation
  -> summarize result and risks
```

## Task classes

| Task class | Codex behavior |
| --- | --- |
| Documentation-only | Update docs, keep examples consistent, no code changes unless requested. |
| Design/spec | Update HLD/LLD/API/test-plan first; avoid implementation changes unless requested. |
| Small bug fix | Inspect failing behavior, patch minimally, add regression test where practical. |
| Feature implementation | Work from user story + HLD/LLD + API contract; update missing specs before large code changes. |
| Refactor | Preserve behavior, keep public API stable, run tests around touched projects. |
| Review | Report correctness, security, architecture, tests, and maintainability risks before proposing changes. |

## Design documentation expectations

HLD documents should explain the system vision, major modules, boundaries, key flows, non-functional requirements, assumptions, risks, and open questions.

LLD documents should explain concrete implementation details: components/classes/services, DTOs, API contracts, schema impact, validation, errors, security handling, sequence/state flows, and test strategy.

Implementation changes must keep HLD, LLD, API contracts, and tests traceable.

## Validation policy

Prefer the narrowest meaningful command:

```powershell
npx nx lint <project>
npx nx test <project>
npx nx build <project>
```

For broader changes:

```powershell
npm run lint:affected
npm run test:affected
npm run build:affected
```

For full verification:

```powershell
npm run lint
npm run test
npm run build
npm run format:check
```

Auth API contract changes also require:

```powershell
npm run openapi:lint:auth
npm run openapi:check:auth
```

## Completion report format

Codex responses and PR descriptions should include:

- Summary of changes.
- Files changed.
- Validation commands run and result.
- Commands not run and reason.
- Design/spec impact.
- Risks and follow-ups.

## Local workspace caution

This chat and GitHub-side automation can only see committed GitHub content. The developer may have uncommitted local files under `E:\workspace\cthub-bsaas`. Before merging, compare the PR with the local workspace.
