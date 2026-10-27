# Antigravity Documentation Guidance

Read `docs/AGENTS.md` for documentation rules and `docs/aidd/README.md` for the shared delivery lifecycle. This file adds Antigravity execution guidance only.

- Use an Antigravity planning artifact when a documentation change alters product scope, contracts, or the delivery process. Keep small corrections in Fast mode.
- Validate the changed document type: Redocly and route parity for affected OpenAPI contracts, Prettier for Markdown, and `git diff --check` for substantial reorganization.
- Use diagram or design MCP tools when the task depends on an existing visual artifact and the tool is available. Record the source and any unavailable verification in the handoff.
- Send critical product specifications to an independent Codex reviewer. The authoring agent does not approve its own specification.
