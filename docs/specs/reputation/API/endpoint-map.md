# Reputation And Reviews API Endpoint Map

**Date:** 2026-05-18
**Status:** Target planning contract

| Capability | Method | Path | Operation ID |
| --- | --- | --- | --- |
| Submit review | `POST` | `/customer/reviews` | `submitCustomerReview` |
| List owner reviews | `GET` | `/partner/reputation/reviews` | `listOwnerReviews` |
| Reply to review | `POST` | `/partner/reputation/reviews/{id}/reply` | `replyToReview` |
| Moderate review | `POST` | `/partner/reputation/reviews/{id}/moderate` | `moderateReview` |
| Reputation insights | `GET` | `/partner/reputation/insights` | `getReputationInsights` |
| Public reviews | `GET` | `/public/salons/{slug}/reviews` | `listPublicSalonReviews` |
