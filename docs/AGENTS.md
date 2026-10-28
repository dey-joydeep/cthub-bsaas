# Documentation Guidelines

Read this file before working under `docs/**`.

## Structure

- User stories: `docs/us/<feature>`
- Technical specs/design/API contracts: `docs/specs/<feature>`
- Production documentation standard: `docs/quality-standards/production-documentation-standard.md`
- Visual collaboration standard: `docs/quality-standards/visual-collaboration-guideline.md`
- Auth API contract: `docs/specs/auth/API/openapi.yaml`
- Status and branch handoff: `docs/status/**`
- Infrastructure planning: `docs/infra-upgrade/**`
- Shared AI-driven development life cycle and Codex playbooks: `docs/aidd/README.md`
- Change inclusion and validation rules: `docs/aidd/change-hygiene.md`

## Source Of Truth

- For new production-ready feature docs, follow `docs/quality-standards/production-documentation-standard.md`.
- For Penpot wireframes or draw.io/diagrams.net diagrams, follow `docs/quality-standards/visual-collaboration-guideline.md`.
- OpenAPI files are the source of truth for external HTTP contracts.
- Specs must reflect current implementation unless explicitly marked as future planning.
- Status docs must not contradict active specs or implementation.
- When docs are stale, update or remove stale language rather than adding another conflicting note.
- Critical product specifications and architecture decisions require an independent Codex reviewer in addition to the author; see `docs/aidd/development-lifecycle.md`.

## Auth Documentation

- Auth route scope is OpenAPI-defined.
- Do not document legacy Auth route aliases as supported.
- Keep these aligned:
  - `docs/specs/auth/API/openapi.yaml`
  - `docs/specs/auth/API/api-hld.md`
  - `docs/specs/auth/API/api-lld.md`
  - `docs/specs/auth/API/fe-service-contracts.md`
  - `docs/specs/auth/WEB/docs/auth/server-alignment.md`
  - `docs/status/auth/auth-backend-plan-and-progress-status.md`

## Style

- Use concrete dates for status and planning docs.
- Prefer concise tables/checklists for status.
- Separate implemented behavior from planned behavior.
- Link to relevant specs/user stories instead of duplicating large blocks.
- Avoid placeholders such as TODO/TBD unless they are intentional tracked work.

## Validation

- For OpenAPI changes, run Redocly lint.
- For Auth route docs, run `scripts/openapi-auth-check.ts`.
- For large doc reorganizations, run `git diff --check`.
- For AIDD prompt/process changes, run Prettier on `.codex/prompts/**/*.md` and `docs/aidd/**/*.md`.
