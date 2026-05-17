# Staff Test Spec

## Backend Unit Tests

- Staff profile validation covers name, contact, employment type, roles, branch assignments, skills, and schedule.
- Role updates enforce actor permission.
- Schedule updates detect future appointment conflict.

## Backend Integration Tests

- Owner creates staff without login access.
- Invitation creates pending auth link without password storage.
- Branch assignment rejects cross-business branch ID.
- Archive preserves historical appointment attribution.

## Web Tests

- Directory filters by branch, role, status, and skill.
- Skill matrix submits only scoped service IDs.
- Schedule conflict response stays attached to affected interval.

## Contract Tests

- Staff role and invitation responses match schema.
- Error keys are stable for duplicate email and schedule conflict.
