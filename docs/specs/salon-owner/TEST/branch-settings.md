# Branch Settings Test Spec

## Backend Unit Tests

- Branch profile validation covers address, contact, status, and timezone.
- Weekly hours validation rejects overlaps and invalid intervals.
- Archive guard detects future confirmed appointments.

## Backend Integration Tests

- Owner creates branch under own business.
- Branch manager edits assigned branch policy only.
- Holiday upsert is idempotent by branch and date.
- Archive with future appointments returns conflict.

## Web Tests

- Hours editor prevents overlapping intervals before submit.
- Holiday calendar displays open and closed state.
- Archive blocker dialog displays future appointment count.

## Contract Tests

- Branch list filters and pagination match OpenAPI.
- Conflict response schema includes blocker details.
