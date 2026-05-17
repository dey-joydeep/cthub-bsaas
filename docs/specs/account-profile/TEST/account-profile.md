# Account And Profile Test Specification

**Date:** 2026-05-18
**Status:** Current planning baseline

## Backend Unit Tests

- Field authorization rejects forbidden profile edits.
- Profile update normalizes allowed fields.
- Last sign-in method check prevents unsafe unlink.
- Preference update preserves transactional notification eligibility.
- Privacy request creation is idempotent while pending.

## Backend Integration Tests

- Profile update writes audit record.
- Security summary hides secrets.
- Cross-user profile access is rejected.
- Privacy request status is visible only to owner or authorized admin.

## Web Tests

- Profile form shows editable and readonly fields correctly by actor.
- Reauth-required response opens reauth flow.
- Connected account unlink conflict renders correct message.
- Privacy delete request requires confirmation.
- SSR test verifies no unguarded browser APIs.

## E2E Candidates

- User changes display name and sees updated shell profile menu.
- User attempts to unlink last provider and receives conflict.
- User creates export request and sees pending status.
