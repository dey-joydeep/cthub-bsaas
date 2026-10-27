# Antigravity API App Guidance

Read `libs/server/AGENTS.md` and `apps/api/AGENTS.md` for architecture and validation rules. This file adds Antigravity execution guidance only.

- Validate affected app wiring with targeted Nx commands. Run Auth integration and OpenAPI parity checks when the change touches global Auth behavior or routes.
- Use a local running API for HTTP smoke checks when that adds evidence beyond automated tests. Start only the services needed for the check, and report when a service is unavailable.
- Send the implementation, contract evidence, and security-sensitive changes to independent Codex reviewers before release readiness.
