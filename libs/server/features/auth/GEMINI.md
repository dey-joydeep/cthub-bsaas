# Antigravity Auth Backend Guidance

Read `libs/server/AGENTS.md` and `libs/server/features/auth/AGENTS.md` for binding Auth rules and validation commands. This file adds Antigravity execution guidance only.

- Preserve the OpenAPI-defined route contract and update affected specs with behavior changes.
- Run the scoped Auth UT, IT, lint, build, and OpenAPI parity checks required by the Auth instructions. Report commands that cannot run and why.
- Use the configured test database when investigating session or token cleanup; verify its target before inspection.
- Send Auth changes to an independent Codex code reviewer and Codex security reviewer. Critical security decisions need two independent Codex assessments.
