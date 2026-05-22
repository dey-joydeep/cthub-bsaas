# Codex Task Policy

**Status:** Current operating guide

This policy defines how Codex should choose depth, validation, and documentation effort.

## General rules

- AIDD applies by default to every new task.
- Start by inspecting existing code and docs.
- Read the nearest scoped `AGENTS.md` before editing a scoped area.
- Read `docs/aidd/README.md` before planning, implementing, fixing, reviewing, or testing a new task.
- Prefer small, reviewable changes.
- Preserve existing architecture unless the task is explicitly architectural.
- Update docs when behavior, contracts, setup, or architecture changes.
- Report uncertainty honestly.
- Do not commit unless the user explicitly asks for a commit.

## New task versus continuation fix

A new task is a separate unit of work requested by the user, even when the wording is short, such as `fix this error`. New tasks must follow the AIDD flow: inspect, scope, plan, patch, validate, and report.

A continuation fix is only an error correction inside the same active task, for example:

- a lint error produced by the current change;
- a unit test failure produced by the current change;
- a build/type-check error produced while validating the current change.

Continuation fixes may be lighter, but they must remain inside the original scope and must not weaken tests, lint rules, type safety, validation, or design/spec alignment.

## Task depth

| Task                | Required behavior                                                                                          |
| ------------------- | ---------------------------------------------------------------------------------------------------------- |
| Question / analysis | Read relevant files, answer with file paths and evidence.                                                  |
| Documentation       | Update docs only unless code changes are explicitly requested.                                             |
| New bug/error fix   | Treat as AIDD: inspect docs/code, identify scope, patch minimally, add regression test where practical.    |
| Continuation fix    | Patch only the current-task validation error, rerun targeted validation, and preserve the original trace.   |
| Feature             | Confirm FRD/FNRD/HLD/LLD/API/validation/test trail, then implement with tests.                             |
| Refactor            | Preserve behavior, keep API stable, run tests around touched projects.                                     |
| Security            | Treat as high-risk; preserve or strengthen safeguards, add tests, document impact.                         |

## When to update design docs

Update or create docs when a change affects any of the following:

- API route, method, request, response, status, or error code.
- DTO, model, schema, or persistence relationship.
- Authentication, authorization, CSRF, cookies, sessions, or throttling.
- Angular routing, guards, UX state, or shared UI behavior.
- i18n keys or supported locale behavior.
- Build, test, lint, deployment, or local setup.
- Project-wide implementation sequencing or validation gates.

## When to stop and report

Stop and report before continuing when:

- The repository contradicts the requested change.
- The change requires secrets or unavailable local services.
- Validation cannot run because the GitHub-side environment lacks the local workspace.
- The change would require broad refactoring beyond the requested scope.
- The change risks data loss or a breaking API/schema change.
- Current code contradicts the documented source of truth and the user has not approved a doc or code correction path.

## Completion standard

A Codex task is complete only when the response or PR clearly states:

- What changed.
- Why it changed.
- What was validated.
- What was not validated.
- Remaining risks or follow-up work.
