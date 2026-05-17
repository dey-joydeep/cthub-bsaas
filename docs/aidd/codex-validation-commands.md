# Codex Validation Commands

Use the narrowest command that validates the change.

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

## Full workspace validation

```powershell
npm run lint
npm run test
npm run build
npm run format:check
```

## API contract validation

For auth OpenAPI changes:

```powershell
npm run openapi:lint:auth
npm run openapi:check:auth
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
