# Codex Task Policy

This policy defines how Codex should choose depth, validation, and documentation effort.

## General rules

- Start by inspecting existing code and docs.
- Prefer small, reviewable changes.
- Preserve existing architecture unless the task is explicitly architectural.
- Update docs when behavior, contracts, setup, or architecture changes.
- Report uncertainty honestly.

## Task depth

| Task | Required behavior |
| --- | --- |
| Question / analysis | Read relevant files, answer with file paths and evidence. |
| Documentation | Update docs only unless code changes are explicitly requested. |
| Bug fix | Reproduce or identify the defect, patch minimally, add regression test where practical. |
| Feature | Confirm or create design trail, then implement with tests. |
| Refactor | Preserve behavior, keep API stable, run tests around touched projects. |
| Security | Treat as high-risk; preserve or strengthen safeguards, add tests, document impact. |

## When to update design docs

Update or create docs when a change affects any of the following:

- API route, method, request, response, status, or error code.
- DTO, model, schema, or persistence relationship.
- Authentication, authorization, CSRF, cookies, sessions, or throttling.
- Angular routing, guards, UX state, or shared UI behavior.
- i18n keys or supported locale behavior.
- Build, test, lint, deployment, or local setup.

## When to stop and report

Stop and report before continuing when:

- The repository contradicts the requested change.
- The change requires secrets or unavailable local services.
- Validation cannot run because the GitHub-side environment lacks the local workspace.
- The change would require broad refactoring beyond the requested scope.
- The change risks data loss or a breaking API/schema change.

## Completion standard

A Codex task is complete only when the response or PR clearly states:

- What changed.
- Why it changed.
- What was validated.
- What was not validated.
- Remaining risks or follow-up work.
