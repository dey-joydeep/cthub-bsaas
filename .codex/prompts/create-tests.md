# Codex Prompt: Create Tests

Use this prompt when adding or improving tests.

```text
You are adding tests in the CTHub Beauty-SaaS Nx monorepo.

Target behavior:
<describe behavior or file under test>

Constraints:
- Follow root AGENTS.md and nested AGENTS.md files.
- Reuse existing test utilities and patterns.
- Prefer deterministic tests.
- Do not weaken coverage thresholds or skip failing tests.

Please do:
1. Inspect the source file and nearby tests.
2. Identify missing happy-path, edge-case, validation, and error-path coverage.
3. Add the smallest useful test set.
4. Run targeted test command where possible.
5. Report changed files, command results, and remaining coverage gaps.
```
