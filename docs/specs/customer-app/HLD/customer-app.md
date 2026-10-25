# Customer App HLD

**Date:** 2026-05-18
**Status:** Current planning baseline

## Boundary

Customer App owns customer-facing workflows. It consumes public discovery, account/profile, salon owner operational APIs, notification preferences, and reputation/review APIs through customer-safe contracts.

## Context Dependencies

| Context          | Dependency                                        |
| ---------------- | ------------------------------------------------- |
| Public Discovery | Salon search, public profile, service visibility. |
| Account/Profile  | Customer identity, contact, preferences.          |
| Appointment      | Booking, reschedule, cancel, status.              |
| POS/Receipts     | Receipts, payments, refunds, dues.                |
| Packages/Loyalty | Balances, rewards, referrals.                     |
| Reputation       | Review submission and status.                     |
| Notifications    | Preferences and recent messages.                  |

## Data Ownership

- Customer app must not expose private salon/staff operational notes.
- Business-owned customer profiles remain scoped to the salon business.
- Auth user may have linked customer profiles across multiple businesses.

## Diagram

See [customer-booking-flow.drawio](../DIAGRAMS/customer-booking-flow.drawio).
