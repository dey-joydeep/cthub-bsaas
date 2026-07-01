# Codex AIDD Guide

**Status:** Current operating guide

## Purpose

This folder defines how Codex should be used for AI-driven development in this repository. It complements, but does not replace, `AGENTS.md`, scoped `AGENTS.md` files, and the production documentation standards.

## Source Order

When instructions overlap, use this order:

1. System and developer instructions from the active Codex session.
2. Root `AGENTS.md`.
3. Nearest scoped `AGENTS.md`.
4. `docs/quality-standards/production-documentation-standard.md` for production documentation work.
5. `docs/specs/project-wide/IMPLEMENTATION/implementation-slicing.md` for implementation sequencing.
6. These AIDD docs and prompt templates.

## Documents

| Document                                                  | Use                                                                                           |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| [Codex Operating Model](codex-operating-model.md)         | Repository-specific workflow for analysis, design, implementation, validation, and reporting. |
| [Codex Task Policy](codex-task-policy.md)                 | Depth, stop conditions, and completion expectations by task type.                             |
| [Codex Review Checklist](codex-review-checklist.md)       | Checklist for PR reviews and self-review before handoff.                                      |
| [Codex Validation Commands](codex-validation-commands.md) | Current validation commands and reporting rules.                                              |
| [MCP Configuration Policy](mcp-configuration-policy.md)   | Repository-vs-global MCP configuration split and safety policy.                               |
| [Codex CLI Operator Guide](codex-cli-operator-guide.md)   | Practical local Codex commands and operator prompts.                                          |

## Repo Codex Assets

- `.codex/agents/*.toml` contains shipped reviewer and implementation helper agents.
- `.codex/environments/environment.toml` points at the repo bootstrap command for fresh Codex worktrees.
- `.codex/prompts/*.md` contains reusable planning, implementation, review, CI-fix, and test prompts.

## Prompt Templates

| Prompt                                 | Use                                                             |
| -------------------------------------- | --------------------------------------------------------------- |
| `.codex/prompts/plan-feature.md`       | Planning a feature or implementation slice before editing code. |
| `.codex/prompts/implement-from-lld.md` | Implementing from an approved LLD/spec/API contract.            |
| `.codex/prompts/review-diff.md`        | Reviewing a diff or pull request.                               |
| `.codex/prompts/fix-ci.md`             | Fixing failing local validation or CI.                          |
| `.codex/prompts/create-tests.md`       | Adding or improving tests.                                      |

## Maintenance Rule

Keep these docs aligned with package scripts, Nx project names, OpenAPI locations, current documentation standards, and safe Codex/MCP configuration. If a command or source-of-truth path changes, update this folder in the same PR.
