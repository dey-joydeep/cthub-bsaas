# CI/CD Integration

This project uses GitHub Actions for continuous integration:

- **Linting:** Runs ESLint on all TypeScript files.
- **Formatting:** Checks code formatting with Prettier.
- **Type Checking:** Runs TypeScript in noEmit mode.
- **Testing:** Runs all Jest tests.

See `.github/workflows/ci.yml` for details.

## Local Quality Checks

- `npx eslint . --ext .ts` — Lint code
- `npx prettier --check .` — Check code formatting
- `npx prettier --write .` — Auto-format code
- `npx tsc --noEmit` — Type checking
- `npm run test` — Run all tests

## Recommendations

- Keep your `README.md` and API docs up to date.
- Add more tests for new features and edge cases.
- Review JWT and authentication logic regularly for security.
