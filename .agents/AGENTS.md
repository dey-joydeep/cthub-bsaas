# CTHub Agent Rules

## Mandatory: Project Tracker Initialization

**Before writing any code, documentation, or making any commits for a new
trackable work item (feature, bug, migration, spike, chore, doc), you MUST:**

1. Invoke the `aidd-project-tracker` skill.
2. Gather `EpicTitle`, `EpicBody`, and `SubIssuesJson` from the task context.
3. Run the appropriate script:
   - **Windows:** `.agents/skills/aidd-project-tracker/scripts/init-tracker.ps1`
   - **macOS/Linux:** `.agents/skills/aidd-project-tracker/scripts/init-tracker.sh`
4. Confirm the Epic, sub-issues, and project board fields are fully populated
   before proceeding.

**Do NOT skip this step.** A task without an Epic on the project board is
invisible to the team and violates the AIDD process.

The skill handles everything automatically: Epic creation, sub-issue creation,
parent-child linking (via GraphQL), project board assignment, and field
population (Status, Priority, Size, Estimate, Domain, Start date, End date).

### When NOT to create an Epic

- The task is a direct continuation of an already-initialized Epic (just add a
  sub-issue to the existing one instead).
- The task is a one-liner fix with no trackable deliverable (e.g., fixing a
  typo, updating a comment).

## Mandatory: Post-Edit Formatting, Linting, & Warning Reporting

**Whenever an AI agent finishes modifying or creating any code or test files (`.ts`, `.spec.ts`, `.html`, `.css`, `.scss`, etc.), you MUST perform file-level AST validation before completing your turn or asking for commit approval:**

1. **Format edited files:** Run Prettier directly on the touched files:
   ```powershell
   npx prettier --write <path/to/edited-file1> <path/to/edited-file2>
   ```
2. **Lint edited files:** Run ESLint directly on any touched TypeScript/JavaScript files:
   ```powershell
   npx eslint --fix <path/to/edited-file1.ts> <path/to/edited-file2.ts>
   ```
3. **Mandatory Warning Reporting:** Inspect the terminal output from ESLint. While warnings will not block staged-level checks or commits, **you MUST explicitly report any warnings or non-fatal lint issues (such as unused variables, deprecated methods, or type assertions) to the user in your response.** Never silently ignore warnings.

### Reference

- Skill: `.agents/skills/aidd-project-tracker/SKILL.md`
- Board: https://github.com/users/dey-joydeep/projects/1/views/1
- AIDD Guide: `docs/aidd/README.md`
