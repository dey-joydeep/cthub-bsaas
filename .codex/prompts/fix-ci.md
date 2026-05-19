# Codex Prompt: Fix CI

Use this prompt when fixing failing validation or CI.

```text
You are fixing CI or validation in the CTHub Beauty-SaaS Nx monorepo.

Failure input:
<paste relevant error log, command, or workflow link>

Constraints:
- Follow root AGENTS.md and nested AGENTS.md files.
- Identify the real root cause before changing code.
- Prefer targeted fixes.
- Do not weaken tests, lint rules, type safety, or coverage thresholds.
- Do not commit unless explicitly requested.

Please do:
1. Summarize the failing command and error.
2. Identify likely root cause with file paths.
3. Apply the minimal fix.
4. Run the failing command again when possible.
5. Run adjacent targeted validation if the fix affects a contract or shared path.
6. Report result, changed files, commands not run, and remaining risks.
```
