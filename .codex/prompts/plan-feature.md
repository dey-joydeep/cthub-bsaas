# Codex Prompt: Plan Feature

Use this prompt when planning a feature before implementation.

```text
You are working in the CTHub Beauty-SaaS Nx monorepo.

Goal:
<describe the requested feature>

Constraints:
- Follow root AGENTS.md and nested AGENTS.md files.
- Inspect existing docs and code before proposing changes.
- Keep the diff surgical.
- Do not implement yet.

Please produce:
1. Current-state findings with file paths.
2. Impacted apps/libs/docs/tests.
3. Proposed HLD/LLD/API/schema/test updates.
4. Implementation steps in safe order.
5. Validation commands to run.
6. Risks and open questions.
```
