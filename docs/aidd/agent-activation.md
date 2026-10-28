# Agent Activation and Shared Roles

**Status:** Current AIDD operating guide

The [development life cycle](development-lifecycle.md) and root and scoped `AGENTS.md` files define shared outcomes, boundaries, and handoffs. Provider files adapt those roles to each runtime. An agent file makes a role available; it does not start a task or approve its own output.

| Runtime     | Role definitions                                                | Activation                                                                                                                                                                                                                                                                          |
| ----------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Antigravity | `.agents/agents/<role>.md` with YAML frontmatter                | Antigravity discovers these profiles. The coordinator can delegate with `invoke_subagent`, select a primary agent in `/agents`, or run a bounded headless task with `scripts/aidd/run-agy-agent.mjs --agent <role> --prompt-file <path>`. The runner verifies the configured model. |
| Codex       | `.codex/agents/<role>.toml`, registered in `.codex/config.toml` | The coordinator asks for a named specialist through Codex subagent orchestration. Registration and description make the role selectable; a prompt and available runtime capability are still required.                                                                              |

Antigravity does not execute Codex TOML profiles, and Codex does not execute Antigravity Markdown profiles. Keep shared domain rules in `AGENTS.md`, the life cycle, specs, and AIDD policies. Keep provider role files focused on their tools, permissions, model routing, and narrow assignment. The two directories are adapters to different agent runtimes, not separate product teams.

Use Antigravity roles for PO, BA, BI, solution and database design preparation, development, QA, DevOps, and release preparation. Use Codex specialists for independent code, contract, architecture, database, product, and security review. A critical security decision needs two separate Codex assessments. Assign each agent a bounded work unit with acceptance criteria and evidence; the AIDD ledger records handoff and resumption. A reviewer does not activate merely because a profile exists: the coordinator must request the review and inspect its result.

The repository currently has role overlap where that helps execution. For example, Antigravity's database architect plans data design, while Codex's database reviewer challenges it. This is intentional separation of author and reviewer. Do not collapse them into one agent profile or let the author supply the independent verdict.
