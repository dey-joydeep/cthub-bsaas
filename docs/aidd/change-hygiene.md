# Change Scope and Validation

**Status:** Current AIDD policy

Use this matrix for each implementation slice, correction, documentation change, and PR. Acceptance criteria determine the smallest reviewable change. Record changed paths and checks in the handoff and PR. A skipped check needs a concrete reason.

## Include and exclude

| Include when affected                                                                     | Keep out of the change                                                 |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Source, configuration, tests, and fixtures needed for the accepted behavior               | Unrelated refactors, formatting, and renames                           |
| User stories, specs, API contracts, validation plans, and web docs whose behavior changed | Local output and editor state                                          |
| Meaningful Prisma migrations and a lockfile when dependencies change                      | Secrets, credentials, and customer exports                             |
| AIDD recovery snapshot when the task uses it                                              | Binary artifacts unless they are an explicit versioned source of truth |

`.env.example`, `.env.sample`, and `.env.template` may be versioned with placeholders. The existing tracked `.env.test` is a test fixture exception: keep only nonsecret local test values there, inspect its diff whenever it changes, and never use it for production credentials. Git ignore rules do not protect files that are already tracked. A source checkpoint captures all nonignored working-tree paths, so review its preview for unrelated files and sensitive content before publishing.

## Checks by changed area

| Changed area                              | Required local check before handoff                                                         | PR gate                                                           |
| ----------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Supported text files                      | Prettier on touched paths; `git diff --check`                                               | Changed-file Prettier and whitespace checks                       |
| TypeScript or JavaScript in an Nx project | Owning Nx lint target and narrow meaningful tests; type-check when contracts may change     | Affected Nx lint and test targets                                 |
| Root scripts outside Nx projects          | Scoped ESLint with zero warnings, relevant script tests, and Prettier                       | Changed-file format plus AIDD script tests when AIDD paths change |
| Documentation or AIDD instructions        | Prettier on touched docs; link, setup, and asset checks when applicable                     | AIDD checks when AIDD paths change                                |
| OpenAPI or endpoint contracts             | Owning Redocly lint and route/parity check; aligned contract and spec docs                  | OpenAPI checks                                                    |
| Prisma schema or migration                | Follow the database access policy; migration status and tests on the isolated test database | Owning project test gate                                          |

Use `npm exec nx` or the repository's `npm run` scripts for Nx targets. Check uncommitted files with `npm run aidd:format:changed -- --worktree`, then use scoped `npx prettier --write <touched-paths>` to fix them. `npm run format` changes the whole repository and is reserved for an explicitly scoped formatting sweep. ESLint applies to code files, not Markdown, JSON, HTML, or CSS. Report warnings and nonfatal issues; a changed-file code lint gate uses zero warnings.

Local development installs a pre-commit hook that checks staged text and code without rewriting it. Production installs and CI skip hook installation; PR CI runs the authoritative checks independently. A hook result never replaces the PR gate.

## Before a PR or checkpoint

1. Inspect `git status --short` and the complete changed-path list. Remove unrelated files from the proposed slice without discarding someone else's work.
2. Inspect changed file contents for secrets, personal data, local output, and accidental debug code. Ignore rules and automated secret patterns are safeguards, not proof of safety.
3. Run the checks in the matrix. Record each command and result, or the reason it could not run.
4. Confirm the PR template's in-scope, out-of-scope, impact, QA, and review fields match the actual diff.
5. For a private source checkpoint, inspect its `preview` paths and tree SHA before `apply`. The checkpoint ref is a recovery copy and is not a reviewed branch commit.

The [validation command guide](codex-validation-commands.md), [review checklist](codex-review-checklist.md), and nearest scoped `AGENTS.md` provide exact project commands and domain rules.
