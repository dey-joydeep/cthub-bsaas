# Reputation And Reviews HLD

**Date:** 2026-05-18
**Status:** Current planning baseline

## Boundary

Reputation owns review lifecycle, moderation, owner response, public visibility, and reputation insights. Notifications own review request delivery. Public Discovery owns public profile composition.

## State Model

| State      | Meaning                                                |
| ---------- | ------------------------------------------------------ |
| `pending`  | Submitted and awaiting moderation or automatic checks. |
| `approved` | Publicly visible according to profile settings.        |
| `rejected` | Not public, retained for audit according to policy.    |
| `hidden`   | Temporarily not public.                                |
| `flagged`  | Requires moderation review.                            |

## Diagram

See [review-moderation-flow.drawio](../DIAGRAMS/review-moderation-flow.drawio).
