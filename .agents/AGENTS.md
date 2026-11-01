# CTHub Agent Rules

Read the root `AGENTS.md`, the nearest scoped `AGENTS.md`, and
`docs/aidd/development-lifecycle.md` before starting a repository task. The
life-cycle document owns the product goal, PO-to-release handoffs, QA role,
and review gates.
Antigravity uses these same `AGENTS.md` files as Codex. Do not maintain parallel
`GEMINI.md` copies. Keep provider-specific execution details in this file,
role profiles, or the AIDD operating guides.
For long-running or multi-agent work, follow `docs/aidd/autonomous-recovery.md`
and checkpoint bounded work units before handoff. Resume interrupted units from
the local ledger without treating partial evidence as complete. Publish a
checkpoint to the private tracking issue when progress must survive this
checkout.
For parallel editing, follow `docs/aidd/parallel-worktrees.md`. Give each
independent delivery slice its own branch and worktree; coordinate agents
sharing a slice through non-overlapping path ownership and one Git writer.

Antigravity execution requires Gemini 3.8 Flash or a stronger eligible model.
Verify the effective model before interactive work; a `flash` tier does not
pin a version. Automated role runs use `scripts/aidd/run-agy-agent.mjs`.
Independent code and contract review and all security checks belong to Codex.

Use available Antigravity MCP tools for browser, Playwright, Penpot, Prisma,
and Postgres work after verifying each tool's target and access. Tool access
does not replace the database profile rules in `docs/aidd/database-access-policy.md`.
Critical product specifications need an independent Codex reviewer; critical
security decisions need two independently tasked Codex assessments.

## Issue-First Tracking

For a trackable change, search the existing issue and project board before
creating tracking. Reuse the issue when it already covers the requested outcome
and record its number in the task handoff.

- Use one issue for a standalone change with acceptance criteria and validation.
- Add every trackable delivery issue to the private cthub Project with a Status.
  The coordinator owns Project updates and verifies each write.
- Use a parent feature issue (Epic) with sub-issues only when the outcome has at
  least two independent, reviewable delivery slices with separate acceptance
  criteria and PRs. Frontend and backend may be separate slices when they meet
  that test; agent roles or internal work steps alone do not justify children.
  Invoke `aidd-project-tracker` when a new Epic is needed; it previews before
  GitHub writes.
- Keep a continuation fix under its existing issue or PR. A read-only question,
  review, or trivial correction does not require new tracking.
- Check for an existing Epic and sub-issues before invoking the initializer. Do
  not create duplicates to satisfy a process step.

Tracking records the work; it is not permission to create branches, commit,
merge, deploy, or change product scope. Follow the root repository rules for
those actions.

## Post-Edit Validation

Follow the root `AGENTS.md` post-edit checks for touched files. Report warnings
and non-fatal lint issues in the completion summary.

### Reference

- Skill: `.agents/skills/aidd-project-tracker/SKILL.md`
- Board: https://github.com/users/dey-joydeep/projects/1/views/1
- AIDD Guide: `docs/aidd/README.md`
