# Codex Prompt: Review Diff

Use this prompt when reviewing a local diff or pull request.

```text
You are reviewing changes in the CTHub Beauty-SaaS Nx monorepo.

Scope:
<describe branch, PR, or changed files>

Constraints:
- Follow root AGENTS.md and nested AGENTS.md files.
- Review correctness, architecture, security, tests, docs, and maintainability.
- Do not rewrite code unless explicitly asked.

Please produce:
1. High-risk findings first.
2. File-path-specific findings.
3. Missing tests or validation.
4. Documentation/spec mismatches.
5. Suggested surgical fixes.
6. Final merge readiness verdict.
```
