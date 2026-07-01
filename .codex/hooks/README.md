# Codex Hooks

This folder contains conservative repository guardrails for Codex.

## Active hooks

`../hooks.json` currently wires:

- `PreToolUse` -> `.codex/hooks/pre_tool_use_policy.py`

## Policy

Hooks should protect the repository without making normal development brittle.

Allowed first-stage behavior:

- block clearly unsafe generated or cache paths such as `node_modules/`, `dist/`, `coverage/`, and `.nx/`;
- block destructive commands that should be handled manually;
- warn when high-impact files such as `package.json`, lockfiles, or Prisma schema are touched.

Avoid hooks that auto-edit source code, auto-format unrelated files, or run broad validation without explicit user intent.

## Local notes

Codex may ask to review and trust project hooks before they run. Review hook scripts before enabling them in a local workspace.

If the hook becomes noisy, first adjust the policy script rather than deleting the hook wiring.
