# Angular CLI MCP Server

The Angular CLI includes a Model Context Protocol (MCP) server that enables AI assistants (like Cursor, Gemini CLI, JetBrains AI, etc.) to interact directly with the Angular CLI. It provides tools for project analysis, guided migrations, and running builds/tests.

## Available Tools (Default)

When the MCP server is enabled, AI agents have access to the following tools:

| Name                        | Description                                                                                               |
| :-------------------------- | :-------------------------------------------------------------------------------------------------------- |
| `ai_tutor`                  | Launches an interactive AI-powered Angular tutor.                                                         |
| `get_best_practices`        | Retrieves the Angular Best Practices Guide (crucial for standalone components, typed forms, etc.).        |
| `list_projects`             | Lists all applications and libraries in the workspace by reading `angular.json`.                          |
| `onpush_zoneless_migration` | Analyzes code and provides a plan to migrate it to `OnPush` change detection (prerequisite for zoneless). |
| `search_documentation`      | Searches the official documentation at `https://angular.dev`.                                             |

## Experimental Tools

Some tools must be enabled explicitly using the `--experimental-tool` (or `-E`) flag.

| Name                       | Description                                                           |
| :------------------------- | :-------------------------------------------------------------------- |
| `build`                    | Performs a one-off build using `ng build`.                            |
| `devserver.start`          | Asynchronously starts a dev server (`ng serve`). Returns immediately. |
| `devserver.stop`           | Stops the dev server.                                                 |
| `devserver.wait_for_build` | Returns the logs of the most recent build in a running dev server.    |
| `e2e`                      | Executes end-to-end tests.                                            |
| `test`                     | Runs the project's unit tests.                                        |

## Configuration

The Angular CLI MCP is optional for this repository. If a task needs it, review its install behavior and use the pinned workspace Angular CLI package rather than an unversioned `npx -y` download. Add a portable, credential-free Antigravity entry under `.agents/mcp_config.json` and its Codex counterpart under `.codex/config.toml` only when both runtimes benefit. Follow `docs/aidd/mcp-configuration-policy.md` and update the AIDD setup check in the same change. The existing Nx tasks remain the default way to build, lint, and test.

## Command Options

You can pass arguments to the MCP server in the `args` array of your configuration:

- `--read-only`: Only registers tools that do not modify the project.
- `--local-only`: Only registers tools that do not require an internet connection.
- `--experimental-tool` (`-E`): Enables specific experimental tools (e.g., `-E build`, `-E devserver`).
