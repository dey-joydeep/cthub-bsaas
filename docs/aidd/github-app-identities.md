# GitHub App Identities

**Status:** Prepared, not activated. The private repository currently needs GitHub Pro environment secrets and a `main` deployment-branch restriction before either App key is put in Actions. No key belongs in a repository secret, source file, local AIDD checkpoint, PR input, or chat.

The two installed Apps provide separate GitHub actors and permissions. They do not replace independent PO and QA work or its evidence. The [AIDD bot dispatch](../../.github/workflows/aidd-bot-dispatch.yml) is a bounded gateway for those actors; it is not a general shell or GitHub API proxy.

| Role | App            | App ID    | Installation ID | Installed repository      | Workflow token permissions                        |
| ---- | -------------- | --------- | --------------- | ------------------------- | ------------------------------------------------- |
| PO   | `shearflow-po` | `5552057` | `177123152`     | `dey-joydeep/cthub-bsaas` | Issues write, metadata read                       |
| QA   | `shearflow-qa` | `5552133` | `177125278`     | `dey-joydeep/cthub-bsaas` | Contents read, pull requests write, metadata read |

The QA App also has Checks write at installation level. The current workflow does not request that permission, because it does not publish a QA check. A later check operation needs immutable test evidence and an independent review of the check's conclusion.

## Activation prerequisites

1. Upgrade the private repository's owner to GitHub Pro or move the repository to a plan that supports private environment secrets and deployment-branch rules. Keep the repository private.
2. Protect `main` and create two environments, `aidd-po` and `aidd-qa`. In each environment, restrict deployment branches to **only `main`**. Verify the restriction on both environments before adding a key. The workflow also checks `github.ref` and checks out `main`, but those checks alone are not a secret boundary because a workflow can be dispatched from another branch.
3. Put the PO PEM only in the `aidd-po` environment secret `SHEARFLOW_PO_PRIVATE_KEY`. Put the QA PEM only in the `aidd-qa` environment secret `SHEARFLOW_QA_PRIVATE_KEY`. Store the full PEM including the BEGIN and END lines. Do not create repository-level secrets with these names. Keep an owner-controlled recovery copy in a secure secret store; revoke old keys when rotating.
4. Merge the workflow and script through the normal review gates. Dispatch `verify` for each role from `main` and check the run logs for `{ "verified": true }` with the expected role and repository. The workflow verifies the App slug and installation ID; the script verifies the minted token sees exactly one repository.

From any machine with authorized `gh` access, dispatch a read-only check:

```powershell
gh workflow run aidd-bot-dispatch.yml --repo dey-joydeep/cthub-bsaas --ref main -f role=po -f operation=verify
gh workflow run aidd-bot-dispatch.yml --repo dey-joydeep/cthub-bsaas --ref main -f role=qa -f operation=verify
```

The `gh` credential dispatches the workflow. The action inside the protected environment creates a short-lived token for the selected App; the private key and token are never returned to the caller. The workflow permits PO issue creation and comments on open issues, and QA PR comments or change requests. QA review requires the exact head SHA that QA examined; the gateway rejects a changed head and pins the submitted review to that commit. The workflow allowlist does not permit QA approval, code writes, merges, releases, or arbitrary API calls. The QA App's broader Pull requests permission could approve a PR if its key or token were exposed through another path. Workflow inputs and resulting comments are visible to repository readers; never put secrets in them. Review evidence and acceptance criteria remain required before any mutation.

The current user-owned [cthub Project](https://github.com/users/dey-joydeep/projects/1) is separate. The PO App installation token cannot update its Project fields. The coordinator continues to run `aidd:track-issue` with an authorized user credential; it must not silently use an App token. GitHub recommends a classic PAT with `project` and `repo` scopes if this user-owned Project later needs unattended Actions updates. That token has a different risk and must be approved and stored separately. Moving the Project to an organization is a separate migration decision.

GitHub references: [App key handling](https://docs.github.com/en/apps/creating-github-apps/about-creating-github-apps/best-practices-for-creating-a-github-app), [Actions App authentication](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/making-authenticated-api-requests-with-a-github-app-in-a-github-actions-workflow), [private environment availability and branch restrictions](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments), and [user Project automation](https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/automating-projects-using-actions).
