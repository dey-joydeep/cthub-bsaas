# Agent Dispatch and Resume

**Status:** Current operating policy

The lead AI agent for an issue is its coordinator. The human owner provides product decisions and controls the final merge. The coordinator owns agent dispatch, checkpoints, quota pauses, and recovery for both Codex and Antigravity desktop or CLI work. Provider conversations are useful continuation handles; the [AIDD ledger](autonomous-recovery.md), private issue checkpoint, and private source checkpoint are the recoverable record across machines.

## Dispatch decision

1. Define one bounded ledger unit before dispatch: owner, role, exact read and write paths, acceptance criteria, dependency units, and expected evidence. Give an agent only the relevant issue, spec, source paths, and last checkpoint. Do not pass an entire previous conversation or raw logs when a short handoff suffices.
2. Dispatch only units whose dependencies are complete and whose source has been checked. Do not start a duplicate agent for a unit that is running, checkpointed but active, or quota-paused. Keep at most two subagents active per coordinator and one writer per delivery slice. A second concurrent agent must have independent work and non-overlapping writes. A branch is per slice, not per agent.
3. Prefer Antigravity at Gemini 3.8 Flash or stronger for suitable PO, BA, implementation, and QA execution. Reserve Codex usage for independent product, architecture, code, and security review. Critical product or security decisions still require the independent agents specified by the [life cycle](development-lifecycle.md); run them sequentially when capacity is low. Do not launch final QA or review while the candidate PR head is still changing.
4. Before expensive work, inspect available provider usage and choose the model for that unit. Codex account usage is shown in its usage view (CLI `/status`); Antigravity CLI `/usage` shows per-model quota. These checks do not promise enough capacity for a future run. If capacity is uncertain, keep the unit queued and continue independent work.
5. Start with provider and effective model metadata when known. Record the provider's conversation ID once available. An interactive agent without ledger command access returns a structured checkpoint to the coordinator immediately. Automated headless runs must also leave a report or be treated as incomplete.

Codex's repository `.codex/config.toml` caps concurrently open subagent threads at two, including idle threads. Reuse an idle thread for related work or close a completed one after its handoff is recorded. This limits parallel consumption, not the account's usage allowance. Antigravity's role profiles define model tier and tools; they do not enforce the two-agent project policy. The coordinator must enforce that policy in desktop and CLI sessions. Do not set a cheap global Codex subagent model that could silently weaken required security or review roles.

## Quota pause and resumption

On a usage-limit error, stop issuing follow-up work to that provider. Check whether the last tool action had an external side effect before retrying it. Preserve the latest report and record the exact failure; do not infer success from partial work. If the provider reports a reset time, record it as an advisory time, not an automatic retry trigger:

```powershell
npm run aidd:ledger -- start --task issue-100 --unit qa --provider codex --model gpt-6.1-sol
npm run aidd:ledger -- session --task issue-100 --unit qa --id <conversation-id>
npm run aidd:ledger -- checkpoint --task issue-100 --unit qa --report tmp/qa-progress.json
npm run aidd:ledger -- quota-pause --task issue-100 --unit qa --reason "Provider usage limit" --resume-after 2026-11-03T00:00:00Z
```

The session and checkpoint commands are optional when no ID or reviewable progress exists. `quota-pause` requires an active unit and a reason. A paused unit is never returned in `readyUnits`, including after `recover` or snapshot import. Export and publish the process snapshot when a pause must survive another machine; publish a private source checkpoint as well for uncommitted source.

Once usage is available, the coordinator checks source and external actions against the checkpoint, then releases and restarts the unit:

```powershell
npm run aidd:ledger -- status --task issue-100
npm run aidd:ledger -- resume --task issue-100 --unit qa
npm run aidd:ledger -- start --task issue-100 --unit qa --provider codex --model gpt-6.1-sol
```

Resume the same idle provider conversation if it is accessible and its context is still relevant. Antigravity CLI supports `/resume` and `agy --conversation <id>`; an idle Antigravity subagent can be messaged again, but a killed one cannot. A Codex idle subagent can be given a follow-up while the session supports it. If the conversation is unavailable, start a new agent with the ledger report, exact source revision, and remaining acceptance criteria. Never treat a provider session ID as a durable source backup.

For headless Antigravity work, `run-agy-agent.mjs` accepts `--conversation <id>` to continue a known conversation. It writes CLI output into ignored `tmp/aidd-agent-runs/` as it arrives, so an unsuccessful or interrupted process can leave partial evidence. Inspect that local output for a conversation ID, partial work, and sensitive material; distill a safe structured ledger report before export or publication. The raw output is local evidence only and is not backed up by the source checkpoint.

If the branch head or base changed, revalidate the unit's work. QA, final review, and security evidence must refer to the current candidate. An old pass cannot satisfy a changed head. If an external write may have succeeded before the error, inspect GitHub or the target system before attempting it again; use an expected head or idempotency key where the action supports one.

When the owner is away, proceed with independent authorized units. Put owner-dependent decisions in the tracking issue under the [autonomy policy](autonomy-and-merge-policy.md); leave dependent units waiting and never convert silence into approval. A provider quota pause is an operational wait, not a reason to ask the owner to manually manage subagents.

## Product boundaries

Official [Codex subagent guidance](https://learn.chatgpt.com/docs/agent-configuration/subagents) documents the concurrency setting, model selection, and extra token consumption. [Codex usage guidance](https://learn.chatgpt.com/docs/pricing) describes variable usage and reset times. [Antigravity subagent guidance](https://antigravity.google/docs/subagents) documents idle and killed states; its [CLI resume](https://antigravity.google/docs/cli/commands/resume) and [usage](https://antigravity.google/docs/cli/commands/usage) commands help continue work and inspect quota. No repository instruction or concurrency setting reserves provider account quota. The ledger therefore preserves progress and prevents accidental redispatch; it cannot guarantee uninterrupted execution.
