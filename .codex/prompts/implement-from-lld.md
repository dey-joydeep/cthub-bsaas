# Codex Prompt: Implement From LLD

Use this prompt when implementation should follow an existing LLD.

```text
You are working in the CTHub Beauty-SaaS Nx monorepo.

Goal:
Implement the behavior described in:
<path to LLD/spec/user story>

Constraints:
- Follow root AGENTS.md and nested AGENTS.md files.
- Keep FRD/FNRD/HLD/LLD/API contract/validation/test docs and implementation aligned.
- Use docs/specs/project-wide/IMPLEMENTATION/implementation-slicing.md for sequencing when applicable.
- Preserve Nx boundaries and import rules.
- Prefer the smallest safe diff.
- Do not move or rename unrelated files.
- For an accepted work item, commit and push reviewable task-branch increments under `docs/aidd/autonomy-and-merge-policy.md`; never merge without the user's exact instruction.

Please do:
1. Read the referenced LLD/spec plus linked FRD/HLD/API/validation/test docs.
2. Read affected source files and nearby tests.
3. Summarize the implementation plan.
4. Apply the minimal implementation.
5. Add or update tests.
6. Update docs first if implementation requires a contract or behavior change.
7. Run targeted Nx and OpenAPI validation where possible.
8. Report changed files, commands run, commands not run, and risks.
```
