# GitHub App Identities

**Status:** PO and QA Apps are registered and installed. No token runner or bot dispatch workflow is active. The Dev App has not been created. Agents must not claim that a GitHub action was performed by one of these bots unless the action actually used that App's installation token.

| Role | App            | App ID    | Installation ID | Installed repository      | Granted repository permissions                               |
| ---- | -------------- | --------- | --------------- | ------------------------- | ------------------------------------------------------------ |
| PO   | `shearflow-po` | `5552057` | `177123152`     | `dey-joydeep/cthub-bsaas` | Issues write, metadata read                                  |
| QA   | `shearflow-qa` | `5552133` | `177125278`     | `dey-joydeep/cthub-bsaas` | Contents read; pull requests and checks write; metadata read |

GitHub Apps can act as distinct bot accounts on GitHub Free, including in this private repository. A future Dev App can use Contents write for HTTPS Git pushes and Pull requests write for PR operations. Only grant Workflows write if the Dev role is explicitly authorized to edit `.github/workflows/**`. GitHub Free cannot enforce protected branches in a private repository, so a Dev App with Contents write could technically push to `main`; agent instructions and local guards are not a server-side restriction.

## Runtime boundary

The private keys are held outside this repository. Never copy a key or token into source, a PR, an AIDD checkpoint, or chat. A future runner must keep each role's key separately, mint short-lived installation tokens limited to `cthub-bsaas` and the operation's minimum permissions, and verify the App and installation before acting. It must not allow an agent to select a different role by simply changing an argument. Separate bot names provide attribution; independent PO and QA evidence still has to be checked.

The current user-owned [cthub Project](https://github.com/users/dey-joydeep/projects/1) is outside the PO App installation token's scope. The coordinator uses a separately authorized user credential for Project fields until a different board ownership or credential design is approved.

The earlier GitHub Actions dispatch prototype was removed because its protected-environment design was unavailable on the current private Free repository and could mislead agents into treating the Apps as active. A Free-compatible trusted runner is a separate implementation task; no private key is needed merely to keep these App registrations installed.

GitHub references: [App Git permissions](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app), [App key handling](https://docs.github.com/en/apps/creating-github-apps/about-creating-github-apps/best-practices-for-creating-a-github-app), [private branch protection availability](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches), and [user Project automation](https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/automating-projects-using-actions).
