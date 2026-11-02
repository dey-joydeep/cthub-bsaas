# MCP Configuration Policy

**Status:** Current operating guide

This document defines how this repository separates portable Codex/MCP configuration from developer-local configuration.

## Principle

Keep the repository configuration portable and safe. Keep machine-specific access, secrets, credentials, local database URLs, and personal workflow preferences in the developer's global Codex configuration.

## Repository-level configuration

The repository may contain only configuration that is safe to commit and useful for every contributor.

Allowed in the repository:

- Nx MCP configuration that uses pinned local project dependencies and no secrets.
- A pinned, credential-free draw.io stdio MCP entry used by this repository's diagram workflow.
- Project-scoped Codex agents under `.codex/agents/`.
- Project-scoped Codex prompts under `.codex/prompts/`.
- Project-scoped Codex hook definitions in `.codex/hooks.json` or `[hooks]` tables in `.codex/config.toml`, with any called scripts under `.codex/hooks/`.
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
- Personal draw.io or Penpot MCP overrides, especially when they need authentication or local paths.
- Any server requiring authentication, local paths, ports, tokens, or private environment variables.

## Recommended split for this project

| Capability              | Repository config                                       | Global/user config                                     |
| ----------------------- | ------------------------------------------------------- | ------------------------------------------------------ |
| Nx workspace assistance | Yes, but only when `nx-mcp` is pinned in workspace deps | Yes, or use this until the repo pins the dependency    |
| Filesystem access       | No                                                      | Yes, workspace allowlist only                          |
| Git operations          | No                                                      | Yes                                                    |
| ESLint                  | No                                                      | Yes                                                    |
| Prisma                  | No                                                      | Yes, with local env                                    |
| Postgres                | No                                                      | Yes, with DB credentials                               |
| GitHub                  | No                                                      | Yes, with account/token handled outside repo           |
| draw.io                 | Yes, pinned stdio tool server without secrets           | Optional personal override                             |
| Penpot                  | No                                                      | Yes, especially when using local/self-hosted instances |

The Antigravity desktop and CLI workspace MCP entry point is `.agents/mcp_config.json`; `.gemini/settings.json` is a legacy location and must not be used for this repository. The Antigravity and Codex draw.io servers in `.agents/mcp_config.json` and `.codex/config.toml` use the same exact `@drawio/mcp` version and `--ignore-scripts`. Its package declares a best-effort postinstall fetch, which is unnecessary for basic MCP startup and should not run implicitly when an agent starts. Review a version update and its install script in both files. This `npx` tool remains outside the project lockfile; its transitive dependency tree can change, so do not treat it as a fully locked build dependency. Codex loads the project MCP entry only when the project is trusted; refresh or restart the local client after changing MCP configuration.

The removed legacy file contained local database credentials and mutable `npx` packages. Keep Prisma, Postgres, and authenticated Penpot connections in each user's local MCP configuration, verify the selected database profile before use, and never place their credentials or token-bearing URLs in tracked repository files. Treat any credential found in committed history as exposed if reused outside a disposable test setup.

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
