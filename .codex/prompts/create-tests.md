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
- Respect server UT/IT split and web test placement conventions.
- For an accepted work item, commit and push task-branch test changes under `docs/aidd/autonomy-and-merge-policy.md`; never merge without the user's exact instruction.

Please do:
1. Inspect the source file and nearby tests.
2. Inspect linked FRD/LLD/API/validation/test docs when the behavior is documented.
3. Identify missing happy-path, edge-case, permission, validation, conflict, and error-path coverage.
4. Add the smallest useful test set.
5. Run targeted test command where possible.
6. Report changed files, command results, commands not run, and remaining coverage gaps.
```
