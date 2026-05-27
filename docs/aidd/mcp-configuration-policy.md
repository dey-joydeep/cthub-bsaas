# MCP Configuration Policy

**Status:** Current operating guide

This document defines how this repository separates portable Codex/MCP configuration from developer-local configuration.

## Principle

Keep the repository configuration portable and safe. Keep machine-specific access, secrets, credentials, local database URLs, and personal workflow preferences in the developer's global Codex configuration.

## Repository-level configuration

The repository may contain only configuration that is safe to commit and useful for every contributor.

Allowed in the repository:

- Nx MCP configuration that uses local project dependencies and no secrets.
- Project-scoped Codex agents under `.codex/agents/`.
- Project-scoped Codex prompts under `.codex/prompts/`.
- Project-scoped Codex hooks under `.codex/hooks/` when they are conservative and documented.
- AIDD docs and playbooks under `docs/aidd/`.
- Repo-scoped skills under `.agents/skills/`.

Do not commit:

- GitHub tokens or personal access tokens.
- Database URLs, passwords, or local test DB credentials.
- Cloud provider credentials.
- Local absolute paths that only work on one machine unless they are documentation examples.
- Personal tool preferences that do not apply to the project.
- MCP server environment variables containing secrets.

## Global/user-level configuration

Keep the following in the developer's user-level Codex configuration unless there is a strong reason to make a sanitized project-level entry:

- Filesystem MCP with local workspace allowlists.
- Git MCP local binary/path details.
- ESLint MCP local command details.
- Prisma MCP environment details.
- Postgres MCP connection details.
- GitHub MCP token/account details.
- draw.io or Penpot MCP details.
- Any server requiring authentication, local paths, ports, tokens, or private environment variables.

## Recommended split for this project

| Capability | Repository config | Global/user config |
| --- | --- | --- |
| Nx workspace assistance | Yes, safe `nx-mcp` entry | Optional overrides |
| Filesystem access | No | Yes, workspace allowlist only |
| Git operations | No | Yes |
| ESLint | No | Yes |
| Prisma | No | Yes, with local env |
| Postgres | No | Yes, with DB credentials |
| GitHub | No | Yes, with account/token handled outside repo |
| draw.io | No | Yes |
| Penpot | No | Yes, especially when using local/self-hosted instances |

## Change policy

When adding or changing `.codex/config.toml`:

1. Confirm the entry is portable and contains no secrets.
2. Prefer project-level entries only when every contributor benefits from the same command.
3. Keep private environment values in global config or local environment files.
4. Document the change in this file when the split changes.
5. Run or request `npm run aidd:assets` after AIDD verification scripts are available.

## Local setup note

Developers may have richer global MCP setups than the repository. That is expected. The repository should describe project-safe behavior; each developer's global config should provide local capabilities.

## Review checklist

Before approving a Codex/MCP configuration PR:

- No secrets or tokens are present.
- No private DB connection strings are present.
- No contributor-specific absolute paths are required for normal use.
- The change is documented in AIDD docs or playbooks.
- The change does not duplicate global-only tool setup unnecessarily.
- The PR states whether local validation was run.
