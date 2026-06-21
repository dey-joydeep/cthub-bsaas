# GitHub Issue First Rule

Codex, Antigravity, and any other autonomous agent must treat GitHub Issues as the implementation contract.

## Mandatory preflight

Before starting any coding, documentation, migration, or configuration task, the agent must:

1. Identify the GitHub issue number.
2. Read the issue:

   ```bash
   gh issue view <issue-number> --json number,title,state,labels,assignees,body,url
   ```

3. Refuse to start if any of the following are true:
   - No issue number is available.
   - The issue is closed.
   - The issue has `status:blocked`.
   - The issue does not have `status:ready-ai`.
   - The issue lacks Acceptance Criteria.
   - The issue lacks Test Plan.
   - The working tree is dirty.

4. Claim the issue before coding:

   ```bash
   gh issue comment <issue-number> --body "Claimed by <Codex|Antigravity>. Branch: <branch-name>. Scope confirmed from issue body."
   ```

5. Create or check out a branch named:

   ```text
   <agent>/<issue-number>-short-slug
   ```

6. Move the issue from `status:ready-ai` to `status:in-progress`.

## Scope rule

The agent must implement only the linked issue. If new scope is found, the agent must stop and comment on the issue instead of expanding the PR.

## Pull request rule

The agent must open a draft PR first. The PR body must include:

- `Closes #<issue-number>` when the issue is fully completed, or `Refs #<issue-number>` for partial work.
- Summary.
- Scope control confirmation.
- Test evidence.
- HLD/LLD update status.

## Merge rule

Agents must not merge their own PRs. Human review is required before merge.

## Design traceability

If an issue changes architecture, DTOs, schemas, API contracts, auth/security behavior, i18n, or test strategy, the relevant HLD/LLD documentation must be updated in the same PR or a linked follow-up issue.
