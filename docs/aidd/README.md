# AI-Driven Development Guide

**Status:** Current operating guide

## Purpose

This folder defines the shared development life cycle and the Codex-specific operating guidance for this repository. It complements `AGENTS.md`, scoped instructions, and the production documentation standards. Both Antigravity and Codex read the same root and scoped `AGENTS.md` files. Antigravity role guidance lives in `.agents/AGENTS.md` and `.agents/agents/`; Codex agent definitions live in `.codex/agents/`.

Start with the [AI-Driven Development Life Cycle](development-lifecycle.md) for product objective, PO-to-release stages, continuous QA, agent ownership, review and security gates, tracking, and branch policy. Then use the relevant task playbook and scoped instructions.

For consequential technology and architecture choices, use the [ADR register](../architecture/decisions/README.md). A proposed ADR records an open question; only an accepted, reviewed decision can change the architecture baseline.

For task-branch commit/push authority, owner-dependent questions, and the human merge gate, use [Autonomy and Merge Policy](autonomy-and-merge-policy.md).

## Source Order

When instructions overlap, use this order:

1. System and developer instructions from the active Codex or Antigravity runtime.
2. Root `AGENTS.md`.
3. Nearest scoped `AGENTS.md`.
4. `docs/quality-standards/production-documentation-standard.md` for production documentation work.
5. `docs/specs/project-wide/IMPLEMENTATION/implementation-slicing.md` for implementation sequencing.
6. These AIDD docs and prompt templates.

For Antigravity execution, also apply `.agents/AGENTS.md` and the selected `.agents/agents/` profile. Runtime instructions and user requests take precedence over repository guidance.

## Documents

| Document                                                             | Use                                                                                           |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| [Development Life Cycle](development-lifecycle.md)                   | Shared product-to-release process, roles, routing, and gates.                                 |
| [Role and Directory Access](role-directory-access.md)                | Repository map, role-specific read/write scope, and verification ownership.                   |
| [Autonomous Recovery](autonomous-recovery.md)                        | Local work-unit ledger, checkpoints, interruption recovery, and stale-evidence rules.         |
| [Agent Dispatch and Resume](agent-dispatch-and-resume.md)            | Quota-aware dispatch, provider sessions, pause states, and cross-machine handoff.             |
| [Parallel Worktrees](parallel-worktrees.md)                          | Branch and worktree ownership, isolation, integration, recovery, and retirement.              |
| [Dependency Change Policy](dependency-policy.md)                     | npm change ownership, forbidden bypasses, lockfile, audit, and install-script review.         |
| [Change Scope and Validation](change-hygiene.md)                     | Inclusion rules and required checks for each changed area.                                    |
| [Database Access Policy](database-access-policy.md)                  | Environment profiles, test isolation, DBA ownership, and migration gates.                     |
| [Backend Reliability Evidence](backend-reliability-evidence.md)      | PostgreSQL contention proof, capacity profiles, and CPU-work decisions.                       |
| [Agent Activation](agent-activation.md)                              | How shared roles map to Antigravity and Codex profiles and how coordinators invoke them.      |
| [GitHub App Identities](github-app-identities.md)                    | Registered bot identities, role boundaries, and current activation status.                    |
| [GitHub App Broker Runbook](github-app-broker-activation-runbook.md) | Setup, recovery, owner deployment, live probes, unsafe choices, and evidence.                 |
| [Codex Operating Model](codex-operating-model.md)                    | Repository-specific workflow for analysis, design, implementation, validation, and reporting. |
| [Codex Task Policy](codex-task-policy.md)                            | Depth, stop conditions, and completion expectations by task type.                             |
| [Codex Review Checklist](codex-review-checklist.md)                  | Checklist for PR reviews and self-review before handoff.                                      |
| [Codex Validation Commands](codex-validation-commands.md)            | Current validation commands and reporting rules.                                              |
| [MCP Configuration Policy](mcp-configuration-policy.md)              | Repository-vs-global MCP configuration split and safety policy.                               |
| [Codex CLI Operator Guide](codex-cli-operator-guide.md)              | Practical local Codex commands and operator prompts.                                          |
| Playbook                                                            | Use                                                         |
| ------------------------------------------------------------------- | ----------------------------------------------------------- |
| [Local Codex Startup](playbooks/local-codex-startup.md)             | Starting a local Codex session from the repository root.    |
| [New Task Flow](playbooks/new-task-flow.md)                         | Kicking off a new implementation, docs, or correction task. |
| [Fix Error Flow](playbooks/fix-error-flow.md)                       | Handling a failing command or defect safely.                |
| [Implementation Slice Flow](playbooks/implementation-slice-flow.md) | Implementing an approved slice or contract change.          |
| [Review PR Flow](playbooks/review-pr-flow.md)                       | Reviewing a PR or branch with AIDD traceability.            |
| [Validation Follow-up](playbooks/validation-follow-up.md)           | Working through local or CI validation failures.            |
| [Merge Readiness Flow](playbooks/merge-readiness-flow.md)           | Checking whether a branch is ready to merge.                |