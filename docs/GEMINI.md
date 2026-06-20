# Antigravity Guidelines: Documentation (`docs`)

## Structure
- User stories: `docs/us/<feature>`
- Technical specs/design/API contracts: `docs/specs/<feature>`
- Production documentation standard: `docs/quality-standards/production-documentation-standard.md`
- Visual collaboration standard: `docs/quality-standards/visual-collaboration-guideline.md`
- Auth API contract: `docs/specs/auth/API/openapi.yaml`
- Status and branch handoff: `docs/status/**`
- Infrastructure planning: `docs/infra-upgrade/**`
- Antigravity/AIDD operating model and prompts: `docs/aidd/README.md`

## Source Of Truth
- For new production-ready feature docs, follow `docs/quality-standards/production-documentation-standard.md`.
- For Penpot wireframes or draw.io/diagrams.net diagrams, follow `docs/quality-standards/visual-collaboration-guideline.md`.
- OpenAPI files are the source of truth for external HTTP contracts.
- Specs must reflect current implementation unless explicitly marked as future planning.
- Status docs must not contradict active specs or implementation.
- When docs are stale, update or remove stale language rather than adding another conflicting note.

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

## Validation & Execution Protocol
- **Antigravity Workflow:** You must use `run_command` to execute the explicit validation tooling when changing documentation:
  - For OpenAPI changes, run Redocly lint: `node_modules/.bin/redocly.cmd lint docs/specs/[feature]/API/openapi.yaml --config .redocly.yaml --max-problems=0`
  - For Auth route docs, run `node_modules/.bin/tsx.cmd scripts/openapi-auth-check.ts`.
  - For large doc reorganizations, check `git diff --check`.
  - For Antigravity/AIDD prompt changes, run Prettier on `.codex/prompts/**/*.md` and `docs/aidd/**/*.md`.
  - **Draw.io/Diagrams:** When interacting with visual `.drawio` architectures, leverage the `drawio` MCP server natively to parse XML nodes, interpret structure, and manage updates.
