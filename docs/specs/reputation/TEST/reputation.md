# Reputation And Reviews Test Specification

**Date:** 2026-05-18
**Status:** Current planning baseline

## Required Tests

- Completed appointment is review-eligible.
- Cancelled/no-show appointment is not review-eligible.
- Duplicate review is blocked.
- Public review list excludes pending/rejected/hidden reviews.
- Owner response writes audit record.
- Review text is sanitized for public display.
- Moderation state transition requires reason.
