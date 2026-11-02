# Codex Prompt: Plan Feature

Use this prompt when planning a feature before implementation.

```text
You are working in the CTHub Beauty-SaaS Nx monorepo.

Goal:
<describe the requested feature>

Constraints:
- Follow root AGENTS.md and nested AGENTS.md files.
- Inspect existing user stories, FRD/FNRD/HLD/LLD/API/validation/test docs, and code before proposing changes.
- Use docs/specs/project-wide/IMPLEMENTATION/implementation-slicing.md when the work belongs to the project-wide roadmap.
- Identify the owning OpenAPI contract: auth, salon-owner, project-wide, or a feature-specific future contract.
- Keep the diff surgical.
- Do not implement yet.
- Planning alone does not authorize implementation; apply `docs/aidd/autonomy-and-merge-policy.md` when the user requests delivery of the work item.

Please produce:
1. Current-state findings with file paths.
2. Impacted apps/libs/docs/tests.
3. Source-of-truth docs and OpenAPI contracts to use.
4. Proposed FRD/HLD/LLD/API/schema/validation/test updates.
5. Implementation steps in safe order.
6. Validation commands to run.
7. Risks and open questions.
```
