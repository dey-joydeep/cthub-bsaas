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
4. Confirm the work item has the user-requested or previously approved mandate defined in [autonomy and merge policy](autonomy-and-merge-policy.md). That mandate covers its task branch and a sibling worktree under the already approved workspace parent. A path outside that parent needs explicit authorization. Place it under the approved workspace parent, for example `E:/workspace/cthub-bsaas-wt-issue-123-salon-booking`; never use an OS temp directory or the repository's ignored `tmp/` for a durable worktree.

After that mandate check, a PowerShell example for a new independent slice is:

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

## Run local servers from more than one worktree

One worktree's `node_modules` can serve several processes at once. Separate worktrees do **not** share a `node_modules` directory: each checkout installs against its own lockfile, generated Prisma client, and native binaries. npm's machine-level download cache can reuse package downloads, but do not symlink or copy installed trees between worktrees. Each checkout also has its own `dist`, `.angular`, `.nx`, and ignored local files.

The normal single-stack ports are API `3000`, customer `4200`, partner `4201`, and admin `4202`. To run another complete development stack, assign a unique slot from `0` to `19` to each active worktree and record the slot in its local handoff. From each worktree root run:

```powershell
node scripts/aidd/prepare-worktree-runtime.mjs --slot 1
```

Slot `1` uses API `3010`, customer `4210`, partner `4211`, admin `4212`, and standalone SSR `4010`. The command generates ignored `environment.worktree.ts` files for the three web apps and an ignored development proxy under `tmp/aidd-runtime/`. Browser requests to `/api` or `/partner` remain on the web origin and are forwarded to that slot's API, including Auth requests that use cookies. It changes no tracked source or secrets. Re-run it after choosing a different slot. Do not start a second stack until its ports are free. The generated files are local setup, so recreate them in a fresh checkout; they are not recovery checkpoints.

Start each web app needed for the slice from its own terminal in the same worktree. Set `AIDD_WORKTREE_API_ORIGIN` in **each** web terminal so server-side rendering resolves local API calls to the same slot. For slot `1`:

```powershell
$env:AIDD_WORKTREE_API_ORIGIN = 'http://localhost:3010'
npm exec nx -- serve web-app-customer --configuration=worktree --port=4210
```

Repeat that environment assignment in separate terminals for the other apps:

```powershell
$env:AIDD_WORKTREE_API_ORIGIN = 'http://localhost:3010'
npm exec nx -- serve web-app-partner --configuration=worktree --port=4211
```

```powershell
$env:AIDD_WORKTREE_API_ORIGIN = 'http://localhost:3010'
npm exec nx -- serve web-app-admin --configuration=worktree --port=4212
```

For the API in slot `1`, supply a **separate local development database** through a protected local environment source, then set the public runtime values in its terminal:

```powershell
$env:PORT = '3010'
$env:CORS_ORIGINS = 'http://localhost:4210,http://localhost:4211,http://localhost:4212'
$env:FRONTEND_URLS = $env:CORS_ORIGINS
$env:FRONTEND_URL = 'http://localhost:4210'
npm exec nx -- serve api
```

Do not place a database password in a committed file or a copied command transcript. Confirm the profile, host, and database name under [Database Access Policy](database-access-policy.md); never reuse staging or production data. The script does not provision or select a database. Automated tests still use only a validated test database and must not inherit this local development `DATABASE_URL` as their test target.

Ports isolate listeners, not browser cookies: cookies for `localhost` are shared across ports in one browser profile. Use a separate browser profile or isolated browser context for each simultaneous stack, especially for Auth verification. The generated proxy covers browser traffic; the SSR interceptor sends only `/api` and `/partner` requests to the local origin when `AIDD_WORKTREE_API_ORIGIN` is set. It does not forward the incoming browser's cookies to the API; verify authenticated SSR routes separately. A standalone built SSR server defaults to port `4000`; set its `PORT` to the slot's SSR port and keep the same API origin variable if running it alongside other stacks. Keep any extra local services, such as email mocks or object storage, on separate ports or run them sequentially. If a port or database cannot be isolated, run the affected integration checks sequentially.

## While streams run

- The coordinator gives each writer one bounded ledger unit with explicit paths, acceptance criteria, and dependencies. A writer does not edit another unit's paths without reassignment. Treat `package.json`, `package-lock.json`, Prisma schema and migrations, CI workflows, generated code, and shared contracts as single-owner files. Coordinate broad formatters, installs, code generation, and migrations so they cannot rewrite another stream's work.
- Each branch runs the narrow checks for its paths. A green check on one branch does not validate another branch or their eventual combined state. Re-run affected checks after integration. QA and independent Codex review examine the current PR head; a new commit or changed base invalidates earlier final review evidence.
- Automated database tests may use only a validated test target. The default `docker-compose.test.yml` binds port `55432`; parallel worktrees must not run destructive tests against one shared test database. Run those tests sequentially, or provision separate test databases, accounts, and ports that pass the [database guard](database-access-policy.md). Never point a test worktree at local, staging, or production data.
- Task-branch pushes and normal commits follow the standing work-item mandate and coordinator-only Git ownership. Before a handoff that must survive loss of the machine, export each slice's ledger snapshot, preview and publish its unique private source checkpoint, then publish its process checkpoint to its private issue. A worktree path or an ignored local ledger alone is not portable recovery evidence.

## Integrate and hand off

For each slice, the coordinator verifies the owning worktree, clean or explained status, intended issue and PR, changed paths, and validation results. Resolve overlaps in the owning branch without replacing another writer's files. Bring dependent branches up to date only after their upstream change is accepted; review the resulting diff again. Do not copy an uncommitted tree into another worktree as an integration shortcut.

One slice has one final PR, with its own QA evidence and independent Codex review. The release owner checks the whole candidate against `main` and the current head before squash merge. Merging one PR does not automatically approve or release dependent PRs. If a worktree or machine is lost, recover the issue's branch and checkpoint using [Autonomous Recovery](autonomous-recovery.md); restore into a clean checkout and revalidate before continuing.

## Retire a worktree

Before removal, stop its agents and background commands. Confirm the PR is merged or explicitly closed, the branch has no needed unpushed commits, the worktree is clean, and any required checkpoint or handoff is durable. Inspect the exact absolute path with `git worktree list --porcelain` and `git -C <path> status --short`; verify it is the intended sibling directory under the approved workspace parent. Then, with removal authorization, use `git worktree remove <path>` from another checkout. Do not use `--force`, a raw recursive delete, or `git worktree prune` to hide an unresolved checkout. Local branch deletion is a separate authorized step: Git may not report a squash-merged source branch as an ancestor of `main`, so verify the merged PR and preserve any unique commits before deleting it. Remote branch cleanup follows the PR merge policy.
