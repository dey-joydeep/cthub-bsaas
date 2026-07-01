# Implementation Slice Flow Playbook

Use this playbook when implementing from an approved planning slice, LLD, or API contract.

## Operator prompt

```text
Follow the repository AIDD workflow. This is an implementation slice.

Source slice/spec:
<path to implementation-slicing, LLD, API contract, or user story>

Read first:
- AGENTS.md
- nearest scoped AGENTS.md
- docs/aidd/README.md
- docs/specs/project-wide/IMPLEMENTATION/implementation-slicing.md when relevant
- related FRD, FNRD, HLD, LLD, API, VALIDATION, WEB, and TEST docs

Do not edit yet. First produce:
1. slice boundary and out-of-scope items
2. affected apps/libs/docs/tests
3. expected DTO/API/schema/validation impact
4. implementation order
5. validation commands
6. risks and rollback considerations
```

## Required Codex behavior

- Implement the smallest independently reviewable slice.
- Preserve existing architecture and Nx boundaries.
- Add or update tests when behavior changes.
- Update docs when implementation changes behavior, contracts, setup, or validation.
- Use named DTOs/types for object-shaped public APIs and avoid ad hoc contract drift.
- Report any mismatch between implementation and specs before changing broad areas.
