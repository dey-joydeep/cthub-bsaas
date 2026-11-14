# Shearflow GitHub App broker activation and recovery

**Status (2026-11-14):** The three Apps are installed, the broker is enabled, and the role identities authenticate. The owner page repair is merged into `main` but has **not** been deployed. No task-mandate PO, Dev, or QA write has been verified. Do not claim the bot rollout is complete.

**Tracking:** [Rollout #113](https://github.com/dey-joydeep/cthub-bsaas/issues/113); [this runbook #119](https://github.com/dey-joydeep/cthub-bsaas/issues/119). Update this status and the evidence log after every deployment or live probe.

## Objective and trust boundary

Give PO, Dev, and QA distinct, verifiable GitHub actors for bounded AIDD tasks without distributing GitHub App private keys to desktop agents. The human owner decides the task outcome and scope once; role agents can then perform only the allowed actions. A successful bot write is evidence of **which App wrote it**, not product approval, independent QA, a security review, or permission to merge.

The flow is:

1. The owner signs into Cloudflare Access with the allowed email and uses a separate Okta Verify TOTP code to create a task mandate on `/owner`. D1 stores its issue, branch, paths, action quotas, and expiry.
2. A role caller authenticates with its own Cloudflare Access service token. It requests a grant for one exact action within that mandate, using a stable request ID.
3. The Worker claims that grant once, uses only the corresponding App key stored as a Worker secret, requests a scoped GitHub installation token, performs the GitHub action, and records the verified actor and result.
4. The coordinator checks the resulting issue, commit, PR, or QA review against the mandate and the actual GitHub author. The human owner separately decides merge and deployment.

The [broker README](../../tools/aidd-broker/README.md) defines the API and client commands. The [identity guide](github-app-identities.md) records exact App permissions and the role boundary. This runbook records operational order, current evidence, recovery, and unsafe choices.

## Verified inventory

| Component             | Current evidence                                                                                             | Required check before reuse                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| PO App                | `shearflow-po`, App 5552057, installation 177123152; Issues write                                            | Installation remains limited to `dey-joydeep/cthub-bsaas`                                   |
| QA App                | `shearflow-qa`, App 5552133, installation 177125278; Contents read, PRs and Checks write                     | Same selected repository; review actor must be `shearflow-qa[bot]`                          |
| Dev App               | `shearflow-dev`, App 5563672, installation 177419051; Contents, PRs, Workflows write; Issues read            | Same selected repository; workflow changes need an explicit workflow grant                  |
| Broker                | `shearflow-aidd-broker.dey-joydeep-cse.workers.dev`; live `BROKER_ENABLED=true`                              | Check `/v1/whoami` and deployed version; never infer state from tracked `wrangler.jsonc`    |
| D1                    | `shearflow-aidd-grants`, binding `GRANTS`; migrations `0001_grants.sql` and `0002_task_mandates.sql` applied | Inspect migration state; do not blindly reapply                                             |
| Access                | Human Allow policy for `dey.joydeep.cse@gmail.com`; Service Auth policy for three role tokens                | Verify exact selectors and the expected audience before any policy change                   |
| Secrets               | Worker secrets `PO_PRIVATE_KEY`, `QA_PRIVATE_KEY`, `DEV_PRIVATE_KEY`, `OWNER_APPROVAL_TOTP_KEY`              | Check names and controlled rotation; never display values                                   |
| Key backup            | Three App private keys verified in OneDrive Personal Vault; same-user local PEM cache removed                | Keep Vault locked during agent work; verify a backup only in an operator-controlled session |
| Repository visibility | GitHub reported **public** on 2026-11-14                                                                     | Do not call recovery refs or issue data private while visibility is public                  |

The role client IDs, audience, and issuer are in `tools/aidd-broker/wrangler.jsonc`. Client IDs are identifiers; service-token secrets, App keys, OAuth codes, Access cookies, and the TOTP seed are credentials. Do not place credential values in this document, terminal transcripts, PRs, or chat.

## What has happened

| Date             | What and why                                                                                                              | How it was checked; remaining limit                                                                                                                                                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-01       | Created and installed three selected-repository GitHub Apps with distinct permissions.                                    | `scripts/aidd/verify-github-app-installation.mjs` verified IDs, slugs, installation IDs, scope, and permissions.                                                                                                                                                |
| 2026-11-01 to 02 | Provisioned Worker keys, Access role callers, and D1. Tested the earlier per-action grant path.                           | A PO comment on issue #100 and Dev commit `2ee002c5` have verified bot authors. These **do not test task mandates**.                                                                                                                                            |
| 2026-11-10       | Applied mandate migration and enabled the task-scoped broker with a separate-device owner TOTP secret.                    | All three role callers returned `admin:false, enabled:true`. A PO caller was denied owner mandate creation and a grant without a mandate.                                                                                                                       |
| 2026-11-14       | Repaired human Access sign-in. The old Cloudflare identity provider failed to fetch account membership.                   | In the Access application's **Login methods**, `Accept all available identity providers` was off; only **One-time PIN** was selected, Cloudflare unchecked. Fresh incognito `/v1/whoami` returned the expected owner principal with `admin:true, enabled:true`. |
| 2026-11-14       | Owner deployed Worker version `d4848b3e-b417-47d2-a9d8-121a66503fd2` enabled.                                             | Wrangler reported `BROKER_ENABLED ("true")`. This version still has the broken owner page. Wrangler logout and temporary config deletion were reported; revocation of the Wrangler Connected Application is **not yet independently verified**.                 |
| 2026-11-14       | Diagnosed owner page stuck at “Owner verified. Initializing approval form…”.                                              | Browser console showed `ReferenceError: __name is not defined` at `owner:50`. The scope preview stayed empty and Create mandate disabled; this is a page script fault, not bad TOTP.                                                                            |
| 2026-11-14       | Merged PR #117, commit `a06b07fe78846e49ff022a2b5e671d568d11a309`, to serve a static owner script with a regression test. | CI and current-head Codex review passed before merge. **Source is fixed; the live Worker has not received this commit.**                                                                                                                                        |

PR #114 prepared the mandate broker; PR #116 prepared owner UI; PR #117 repaired its runtime bundling failure. Consult their merged diffs before changing the trust boundary. QA review and Dev PR creation have not been tested live. No mandate-based role write has succeeded yet.

## Recover the setup on another machine

1. **What:** Read this file, the broker README, the identity guide, issue #113, and current PR/commit status. **Why:** A merged fix and a deployed Worker are different states. **How:** Record the checked-out commit, Git status, remote repository, Worker version, Access policy, and `/v1/whoami` result. Preserve unrelated work; use a clean task worktree.
2. **What:** Confirm repository visibility and installation scope. **Why:** The repo was public on 2026-11-14 although older docs assumed private. Recovery refs and issues are visible according to current visibility. **How:** Inspect GitHub repository visibility and each App's “Only select repositories” installation. Restore private visibility only by an explicit owner decision.
3. **What:** Confirm the D1 binding and migration state. **Why:** Replaying an already applied schema change can fail or damage operational state. **How:** Use owner-controlled Cloudflare D1 tools to inspect `shearflow-aidd-grants` and the migration ledger before applying any missing migration. Never point these checks at the salon product or test database.
4. **What:** Confirm Access identity. **Why:** A healthy Worker cannot authorize an owner or role caller without the correct Access policy and login method. **How:** In a fresh browser, visit `/v1/whoami` and require the exact owner principal, `admin:true`, and `enabled:true`. For role callers, use `node scripts/aidd/broker-client.mjs --command whoami --role <po|qa|dev>` with each protected token file and require distinct `service:<client-id>` principals, `admin:false`, `enabled:true`.
5. **What:** Restore secrets only if missing or rotating. **Why:** Desktop-readable PEMs bypass the broker; the owner TOTP seed must remain separate from desktop agents. **How:** Unlock the Personal Vault only in an operator session, verify the correct App/key match with the read-only verifier, provision Worker secrets through an owner-controlled Cloudflare session, then lock the Vault and remove any same-user cache. Never create a local role token file beneath the workspace parent.
6. **What:** Resume at the first unverified item in the evidence log. **Why:** An expired grant, stale checkpoint, or successful identity check is not proof of the next GitHub action. **How:** Keep the issue/PR, exact head SHA, grant ID, actor, result URL, and timestamp in the tracking issue; keep credentials out.

## Next owner-only deployment: merged owner-page repair

**Prerequisite:** Verify a clean checkout of `a06b07fe78846e49ff022a2b5e671d568d11a309` or a later reviewed `main` commit containing PR #117. The existing `E:\workspace\cthub-bsaas-broker-owner-ui` worktree was created for earlier owner UI work and must **not** be deployed from its old head. Use a clean deployment worktree; keep unrelated checkouts intact.

**What:** Deploy the repaired owner page while preserving the live enabled state and Worker secrets. **Why:** The tracked `wrangler.jsonc` intentionally says `BROKER_ENABLED=false`; a normal deploy can switch off the live broker. **How:** An owner-controlled terminal, with desktop agent processes closed, checks the exact commit and creates a temporary config in the deployment worktree and removes it immediately afterward:

```powershell
git status --short
git fetch origin main
git switch --detach a06b07fe78846e49ff022a2b5e671d568d11a309
git rev-parse HEAD
Set-Location .\tools\aidd-broker
$source = Get-Content -LiteralPath '.\wrangler.jsonc' -Raw
if ($source -notmatch '"BROKER_ENABLED": "false"') { throw 'Unexpected broker config; stop.' }
$source.Replace('"BROKER_ENABLED": "false"', '"BROKER_ENABLED": "true"') |
  Set-Content -LiteralPath '.\wrangler.owner-deploy.jsonc' -NoNewline
Select-String -Path '.\wrangler.owner-deploy.jsonc' -Pattern 'BROKER_ENABLED'
npx --yes wrangler@4.162.0 login
npx --yes wrangler@4.162.0 deploy --config .\wrangler.owner-deploy.jsonc --keep-vars
npx --yes wrangler@4.162.0 logout
Remove-Item -LiteralPath '.\wrangler.owner-deploy.jsonc'
```

Stop if `git status --short` is not empty, the head is wrong, the target account/Worker is wrong, the diff proposes `BROKER_ENABLED=false`, a secret value appears, or the deployment binding is not `shearflow-aidd-grants`. Review Wrangler's remote/local diff **before** answering its continue prompt. In the 2026-11-14 successful deployment, the diff only added `database_name` and `migrations_dir`; a changed diff requires fresh review. `--keep-vars` preserves remote variables; it is not permission to ignore the displayed changes. After logout, revoke the temporary Wrangler authorization under Cloudflare **My Profile → Access Management → Connected Applications** and verify it is gone before reopening desktop agents.

**Verify:** In fresh browser sessions, check `/v1/whoami`, then `/owner`. The page must finish initialization, render a nonempty “Scope to approve” preview as fields change, and enable Create mandate only after valid fields, confirmation, and code. Do **not** enter a TOTP code just to test page rendering. Record the new Worker version, time, browser result, and any console error here. If deployment fails or the page still stalls, leave mandates unissued and investigate the new version; do not deploy the old worktree.

The earlier `wrangler deploy --var BROKER_ENABLED:true --keep-vars` attempt warned that local `false` would replace remote `true`; the owner correctly chose **N** to continue and **N** to update the tracked local config, then logged out. Do not assume the CLI `--var` overrides the tracked value in this setup.

## Live mandate and role probe after page verification

**What:** Prove one bounded write per role without merging its test PR. **Why:** Installation, identity, and earlier per-action pilots do not prove the task mandate, grant, quota, GitHub action, and actor chain. **How:**

1. Create or reuse a dedicated pilot issue under #113 with acceptance criteria for the probes. Use its **actual** number below; do not bind the pilot PR to parent #113, which should remain open. Add the pilot issue to the Project.
2. Create a clean task branch `chore/broker-live-role-probes`. Confirm the target head and exact allowed file `docs/status/aidd/broker-live-role-probes.md`.
3. On `/owner`, enter outcome “Verify PO, Dev, and QA bot writes for pilot issue #<actual>; leave its PR unmerged”, the actual issue number, that branch, and only that file path. Set limits: `po.comment-issue:1`, `dev.commit:1`, `dev.create-pr:1`, `qa.review-pr:1`; all others zero; lifetime one day. Inspect the JSON preview, tick confirmation, and enter a fresh six-digit Okta Verify code **only on the owner page**. Record the returned mandate ID, never the code.
4. Execute the PO comment, Dev commit, Dev PR, and QA review with their own service-token callers and the client contract in the broker README. Bind each call to the current issue, branch, PR, and expected head. Use the prepared-commit/sync helpers for Dev; do not make a duplicate personal commit.
5. Independently inspect GitHub: issue comment by `shearflow-po[bot]`; commit and PR by `shearflow-dev[bot]`; review by `shearflow-qa[bot]` on the exact PR head. Confirm the PR remains unmerged, CI status, grant receipts, and quota use. Add evidence links and versions to this log, the pilot issue, and #113.
6. Test denied cross-role/branch/path attempts and revoked or expired mandate behavior only with bounded, reviewed test inputs. Revoke with a fresh owner code if the pilot scope is no longer needed. Reconcile any in-flight action first.

The role client persists a stable request ID in Git metadata. If a response is lost, reuse that ID with the same payload; do not create a second action. A grant marked `needs-reconciliation` needs GitHub and D1 inspection. Never blindly execute it again.

## Wrong choices and cautions

| Do not                                                                                                                                          | Why; correct choice                                                                                                                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deploy the old owner UI worktree or assume merged means live.                                                                                   | The deployed version still contains the `__name` page fault. Verify source commit and Worker version separately.                                                                    |
| Accept a Wrangler diff that changes `BROKER_ENABLED` to `false`, or casually sync remote values into tracked config.                            | It can disable the broker or hide the intentional fail-closed default. Use a reviewed temporary true config and `--keep-vars`.                                                      |
| Use Cloudflare as the human login provider for this application while the membership error persists.                                            | Fresh login failed before reaching the Worker. The verified application login method is One-time PIN, with the exact-email Allow policy.                                            |
| Select “all repositories” for the Apps or “all identity providers” for Access.                                                                  | This broadens reach and can reintroduce the failed login path. Keep the selected repository and explicit login method.                                                              |
| Put App PEMs, service-token secrets, owner seed, or deployment OAuth in a workspace, submodule, local same-user cache, command output, or chat. | Desktop agents could bypass the broker or owner approval. Use Worker secrets, protected role-token files outside the workspace parent, and an owner-controlled Vault/authenticator. |
| Use a dummy Git author or personal `gh` session to claim bot authorship.                                                                        | Names do not prove GitHub identity. Require the actual `shearflow-<role>[bot]` actor; report any coordinator bootstrap write as the real account.                                   |
| Infer bot activation from `admin:false, enabled:true` or the old issue #100 pilots.                                                             | These prove identity/earlier actions, not a successful task mandate and all four current actions. Complete the live probe.                                                          |
| Retry a consumed or uncertain grant with a new request ID.                                                                                      | It may duplicate a write. Reuse the stable ID for a lost response and reconcile `needs-reconciliation`.                                                                             |
| Share or reuse an Okta code, or submit repeated guesses.                                                                                        | The code is owner-only, single-use for approval/revocation, and approval attempts are limited.                                                                                      |
| Treat current repository refs as private.                                                                                                       | GitHub reported the repository public on 2026-11-14. Recheck visibility before storing sensitive process state. Never store credentials in any ref.                                 |
| Let a role agent merge, tag, deploy, or change workflow files through an ordinary Dev grant.                                                    | These are separate authorities. The owner explicitly decides merge/deploy; workflow edits need their dedicated action and reviewed scope.                                           |
| Run broker probes against a salon product or test database.                                                                                     | The broker uses its dedicated D1 database only. Keep product data and database verification separate.                                                                               |

## Update log

- **2026-11-14:** Initial reconstruction from merged PRs, issue history, owner CLI output, Access/browser evidence, and current repository docs. The source fix is merged; deployment and task-scoped write probes remain pending.
- **Next entry:** Record deployment commit, Wrangler version, Worker version, runtime `BROKER_ENABLED`, Access result, owner-page preview result, credential revocation check, and any failure.
- **Then:** Record pilot issue and mandate ID, four action result URLs/actors, PR head and CI/review result, and revocation or expiry.

Official references: [GitHub App installation authentication](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app-installation), [GitHub App key handling](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/managing-private-keys-for-github-apps), [Cloudflare Access One-time PIN](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/), [Wrangler deploy](https://developers.cloudflare.com/workers/wrangler/commands/workers/#deploy).
