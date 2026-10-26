# Notifications HLD

**Date:** 2026-05-18
**Status:** Current planning baseline

## Boundary

Notifications owns message intent, template rendering, consent checks, queueing, delivery state, and logs. Provider-specific sending belongs to integration adapters.

## Components

| Component           | Responsibility                                           |
| ------------------- | -------------------------------------------------------- |
| Notification policy | Transactional vs marketing and channel eligibility.      |
| Template service    | Template lookup, localization, safe variable rendering.  |
| Dispatch service    | Idempotency, queueing, retry scheduling, delivery state. |
| Provider port       | Sends through email, SMS, WhatsApp, or in-app provider.  |
| Delivery log        | Searchable attempts and failures.                        |

## Diagram

See [notification-dispatch-flow.drawio](../DIAGRAMS/notification-dispatch-flow.drawio).
