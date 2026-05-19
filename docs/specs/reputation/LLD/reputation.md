# Reputation And Reviews LLD

**Date:** 2026-05-18
**Status:** Current planning baseline

## Commands And Queries

| Operation | Type | Notes |
| --- | --- | --- |
| `submitReview` | Command | Validates appointment eligibility and duplicate rule. |
| `replyToReview` | Command | Owner response with audit. |
| `moderateReview` | Command | Platform/owner moderation according to role. |
| `listPublicReviews` | Query | Approved public reviews only. |
| `listOwnerReviews` | Query | Business-scoped review management. |
| `getReputationInsights` | Query | Trends and response metrics. |

## Test Implications

Tests must cover review eligibility, duplicate prevention, public visibility, XSS sanitization, response audit, and moderation state transitions.
