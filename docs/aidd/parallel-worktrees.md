# Parallel Worktrees

**Status:** Current AIDD operating policy

Use this guide when two delivery streams may edit the repository at the same time. A worktree is a local checkout of a Git branch or a detached commit; it is not a new issue, agent identity, approval, or review gate. The coordinator remains accountable for the combined result. The [development life cycle](development-lifecycle.md) owns issue, branch, PR, QA, review, and merge policy; the [recovery protocol](autonomous-recovery.md) owns checkpoints.

## Choose the boundary

| Situation                                                                   | Checkout and branch rule                                                                                                                                                    |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One delivery slice with agents editing different files                      | Use its one branch and worktree. Assign non-overlapping paths and ledger units before dispatch. The coordinator alone stages, commits, rebases, and pushes.                 |
| Agents need to edit the same file or run commands that rewrite shared files | Sequence their work. Hand off a validated state before the next writer starts.                                                                                              |
| Independent slices with separate acceptance criteria and PRs                | Give each slice its own tracking issue, branch, worktree, and task ID. Use an Epic only when the outcome needs multiple independent slices.                                 |
| QA or Codex review without edits                                            | Inspect the candidate PR and commit. A separate detached worktree is optional when isolation is useful; it does not create a delivery branch or change review independence. |

Do not create branches or issues per agent, frontend/backend label, or internal ledger unit. Do not check out one delivery branch in multiple worktrees or override Git's worktree branch lock. If two slices depend on each other, record the dependency in their issues; integrate and validate the upstream slice first, then update the downstream slice against the accepted base. Each ordinary slice PR targets `main` after its dependency merges. Keep the downstream PR diff limited to its own slice.

## Before creating a worktree

1. Reuse the matching issue and Project item; record acceptance criteria, the slice owner, dependent issues, and the planned PR. Assign a unique task ID for each slice, such as `issue-123`. A parent Epic is not the task ID for all child branches.
2. Inspect `git worktree list --porcelain`, `git status --short`, the intended branch name, and the remote base. Reuse an existing suitable worktree. Inspect local and remote branches before choosing a new name. Never move an existing checkout or overwrite its uncommitted changes.
3. Record the branch, owning issue, assigned paths, coordinator, and intended worktree location in the handoff. A local absolute path is machine-specific; the issue, branch, and task ID are the portable identity.
4. Obtain the user confirmation required by root `AGENTS.md` before creating or switching a branch. A sibling worktree path also needs authorization because it is outside the current checkout. Place it under the approved workspace parent, for example `E:/workspace/cthub-bsaas-wt-issue-123-salon-booking`; never use an OS temp directory or the repository's ignored `tmp/` for a durable worktree.

After that approval, a PowerShell example for a new independent slice is:

```powershell
git fetch origin main
git worktree add -b feature/issue-123-salon-booking ../cthub-bsaas-wt-issue-123-salon-booking origin/main
git -C ../cthub-bsaas-wt-issue-123-salon-booking status --short
git -C ../cthub-bsaas-wt-issue-123-salon-booking branch --show-current
```

Verify the resolved path is under the approved workspace parent and the new branch points at the intended base. If a branch already exists, inspect it and use `git worktree add <path> <existing-branch>` only when that branch is not checked out elsewhere. Do not use `--force` to bypass Git's worktree checks. An IDE or agent worktree tool follows the same branch, path, and authorization rules; check its bootstrap command before allowing it to install dependencies.

Run the setup from the new worktree root after checking the [dependency policy](dependency-policy.md) and the Node/npm versions. The Codex bootstrap in `.codex/environments/setup.mjs` uses the lockfile and runs `npm ci --ignore-scripts --no-audit --fund=false` when dependencies are absent, followed by the explicit version check, local hook setup, and native toolchain smoke check. Agents using another runtime can run the same reviewed setup commands below. Each worktree owns its own ignored dependencies, generated files, local configuration, and `tmp/aidd-ledger/`; never copy `node_modules`, ignored secrets, or a ledger directory between worktrees. Read root and nearest scoped `AGENTS.md` in that checkout before edits.

```powershell
npm ci --ignore-scripts --no-audit --fund=false
node scripts/check-versions/node-version.js
node .husky/install.mjs
npm run aidd:toolchain-smoke
```

For server tasks, run the reviewed Prisma client generation separately before server builds or tests: `npx prisma generate --schema libs/server/data-access/prisma/schema.prisma`, then `node scripts/aidd/smoke-installed-toolchain.mjs --require-prisma-client`. Neither command queries a database. Do not run installation in a worktree merely to inspect a PR's source.

## While streams run

- The coordinator gives each writer one bounded ledger unit with explicit paths, acceptance criteria, and dependencies. A writer does not edit another unit's paths without reassignment. Treat `package.json`, `package-lock.json`, Prisma schema and migrations, CI workflows, generated code, and shared contracts as single-owner files. Coordinate broad formatters, installs, code generation, and migrations so they cannot rewrite another stream's work.
- Each branch runs the narrow checks for its paths. A green check on one branch does not validate another branch or their eventual combined state. Re-run affected checks after integration. QA and independent Codex review examine the current PR head; a new commit or changed base invalidates earlier final review evidence.
- Automated database tests may use only a validated test target. The default `docker-compose.test.yml` binds port `55432`; parallel worktrees must not run destructive tests against one shared test database. Run those tests sequentially, or provision separate test databases, accounts, and ports that pass the [database guard](database-access-policy.md). Never point a test worktree at local, staging, or production data.
- Pushes and normal commits follow the root authorization rules. Before a handoff that must survive loss of the machine, export each slice's ledger snapshot, preview and publish its unique private source checkpoint, then publish its process checkpoint to its private issue. A worktree path or an ignored local ledger alone is not portable recovery evidence.

## Integrate and hand off

For each slice, the coordinator verifies the owning worktree, clean or explained status, intended issue and PR, changed paths, and validation results. Resolve overlaps in the owning branch without replacing another writer's files. Bring dependent branches up to date only after their upstream change is accepted; review the resulting diff again. Do not copy an uncommitted tree into another worktree as an integration shortcut.

One slice has one final PR, with its own QA evidence and independent Codex review. The release owner checks the whole candidate against `main` and the current head before squash merge. Merging one PR does not automatically approve or release dependent PRs. If a worktree or machine is lost, recover the issue's branch and checkpoint using [Autonomous Recovery](autonomous-recovery.md); restore into a clean checkout and revalidate before continuing.

## Retire a worktree

Before removal, stop its agents and background commands. Confirm the PR is merged or explicitly closed, the branch has no needed unpushed commits, the worktree is clean, and any required checkpoint or handoff is durable. Inspect the exact absolute path with `git worktree list --porcelain` and `git -C <path> status --short`; verify it is the intended sibling directory under the approved workspace parent. Then, with removal authorization, use `git worktree remove <path>` from another checkout. Do not use `--force`, a raw recursive delete, or `git worktree prune` to hide an unresolved checkout. Local branch deletion is a separate authorized step: Git may not report a squash-merged source branch as an ancestor of `main`, so verify the merged PR and preserve any unique commits before deleting it. Remote branch cleanup follows the PR merge policy.
