# Codex Prompt: Implement From LLD

Use this prompt when implementation should follow an existing LLD.

```text
You are working in the CTHub Beauty-SaaS Nx monorepo.

Goal:
Implement the behavior described in:
<path to LLD/spec/user story>

Constraints:
- Follow root AGENTS.md and nested AGENTS.md files.
- Keep HLD, LLD, API contract, tests, and implementation aligned.
- Prefer the smallest safe diff.
- Do not move or rename unrelated files.

Please do:
1. Read the referenced LLD/spec and affected source files.
2. Summarize the implementation plan.
3. Apply the minimal implementation.
4. Add or update tests.
5. Update docs only if implementation changes the documented behavior.
6. Run targeted validation where possible.
7. Report changed files, commands run, commands not run, and risks.
```
