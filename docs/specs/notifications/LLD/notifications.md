# Notifications LLD

**Date:** 2026-05-18
**Status:** Current planning baseline

## Commands And Queries

| Operation | Type | Notes |
| --- | --- | --- |
| `enqueueNotification` | Command | Validates consent, template, idempotency, and channel. |
| `renderTemplate` | Command | Produces provider-safe content. |
| `dispatchNotificationAttempt` | Command | Calls provider adapter and stores result. |
| `retryNotificationAttempt` | Command | Applies retry policy. |
| `listDeliveryLogs` | Query | Authorized searchable delivery log. |
| `updateNotificationTemplate` | Command | Validates variables and localization. |

## State Machine

| State | Meaning |
| --- | --- |
| `queued` | Accepted for dispatch. |
| `suppressed` | Not sent because consent/policy blocks it. |
| `sending` | Provider call in progress. |
| `delivered` | Provider accepted or delivered according to channel. |
| `failed_retryable` | Retry allowed. |
| `failed_final` | Retry exhausted or non-retryable. |

## Test Implications

Tests must cover consent suppression, duplicate reminder prevention, template variable validation, provider failure, retry exhaustion, and delivery-log authorization.
