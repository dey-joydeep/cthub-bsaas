# Reputation And Reviews Web Specification

**Date:** 2026-05-18
**Status:** Current planning baseline

## Routes

| Route                                   | Screen ID                       |
| --------------------------------------- | ------------------------------- |
| `/customer/reviews/new`                 | `reputation.customerReviewForm` |
| `/partner/reputation/reviews`           | `reputation.ownerReviewList`    |
| `/partner/reputation/insights`          | `reputation.insights`           |
| `/admin/platform/reputation/moderation` | `reputation.platformModeration` |

## Screen Requirements

- Customer review form must show appointment context and one-review rule.
- Owner review list must show status, rating, text, response, and moderation action.
- Public display must use approved content only.
- Insights must show rating trend and response status.
