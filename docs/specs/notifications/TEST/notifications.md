# Notifications Test Specification

**Date:** 2026-05-18
**Status:** Current planning baseline

## Required Tests

- Transactional notification queues despite marketing opt-out.
- Marketing notification is suppressed when consent is missing.
- Invalid template variable is rejected.
- Duplicate reminder is prevented.
- Provider failure stores retryable delivery log.
- Retry exhaustion marks final failure.
- Delivery logs enforce business/support scope.
