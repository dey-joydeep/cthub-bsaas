# Platform Admin Test Specification

**Date:** 2026-05-18
**Status:** Current planning baseline

## Backend Tests

- Admin mutation rejects missing MFA.
- Provisioning is idempotent or recoverable.
- Invalid status transition returns conflict.
- Support access requires reason and writes audit before returning sensitive view.
- Feature flag scope validation rejects invalid override.

## Web Tests

- Dashboard handles partial health data.
- Tenant status action shows confirmation and reason field.
- Support view blocks data until reason is submitted.
- Feature flag screen displays safe default and scope.
- Audit filters paginate and preserve search state.

## E2E Candidates

- Admin provisions salon and owner onboarding path is created.
- Admin suspends tenant and support audit records reason.
- Support admin opens scoped support view with reason.
