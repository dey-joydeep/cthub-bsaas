# AIDD Status Snapshots

This directory holds versioned recovery snapshots exported by `npm run aidd:ledger -- export --task <id>`. Each `<task-id>.json` records the bounded work units and their last checkpoint for a tracked AIDD work item.

The live append-only event ledger stays under ignored `tmp/aidd-ledger/`. Commit a snapshot at a meaningful handoff when authorized; a fresh checkout can restore it with `npm run aidd:ledger -- import --task <id>`. Before a normal branch commit, `publish --mode apply` stores process state on the private tracking issue. The authorized `aidd:source-checkpoint` command backs up nonignored source to a dedicated private Git ref without moving the task branch. See [Autonomous Recovery](../../aidd/autonomous-recovery.md) for restore steps and limits.
