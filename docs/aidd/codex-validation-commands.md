# Codex Validation Commands

**Status:** Current operating guide

Use the narrowest command that validates the change.

Use the [change scope and validation matrix](change-hygiene.md) to select checks by changed area. For PRs, `npm run aidd:format:changed -- <base-ref> <head-ref>` checks supported changed files while respecting `.prettierignore`. For uncommitted work, use `npm run aidd:format:changed -- --worktree`; format only the paths it reports.

## Project discovery

```powershell
npx nx show projects
npx nx show project <project>
npm run nx:graph
```

## Targeted validation

```powershell
npx nx lint <project>
npx nx test <project>
npx nx build <project>
```

## Affected validation

```powershell
npm run lint:affected
npm run test:affected
npm run build:affected
```

## Dependency and branch policy validation

For dependency or branch policy changes, run the relevant checks before handoff:

```powershell
npm run deps:policy
npm run deps:policy:test
npm run deps:change:test
npm run aidd:branch-policy:test
npm run aidd:premerge:test
npm run aidd:track-issue:test
```

Run `npm audit --audit-level=high` when the lockfile changes. The live `npm run aidd:premerge -- <PR-number>` command is required after the final committed PR head and review are available.

## Full workspace validation

```powershell
npm run lint
npm run test
npm run build
npm run format:check
```

## API contract validation

For Auth OpenAPI changes:

```powershell
npm run openapi:lint:auth
npm run openapi:check:auth
```

For Salon Owner OpenAPI changes:

```powershell
node_modules/.bin/redocly.cmd lint docs/specs/salon-owner/API/openapi.yaml --config .redocly.yaml --max-problems=0
```

For project-wide supporting OpenAPI changes:

```powershell
node_modules/.bin/redocly.cmd lint docs/specs/project-wide/API/openapi.yaml --config .redocly.yaml --max-problems=0
```

For any future feature OpenAPI contract:

```powershell
node_modules/.bin/redocly.cmd lint docs/specs/<feature>/API/openapi.yaml --config .redocly.yaml --max-problems=0
```

For endpoint maps, schema catalogs, and implementation-slicing docs, also run:

```powershell
git diff --check
npx prettier --check docs/specs/<feature>/**/*.md
```

## Common app commands

```powershell
npm run dev:api
npm run dev:web-admin
npm run dev:web-partner
npm run dev:web-customer
npm run build:api
npm run build:app:admin
npm run build:app:partner
npm run build:app:customer
```

## Reporting format

When Codex finishes, report commands in this format:

```text
Validation run:
- npx nx test <project>: passed
- npx nx lint <project>: passed

Not run:
- npm run build: reason
```

Never say validation passed unless the command was actually run and completed successfully.
