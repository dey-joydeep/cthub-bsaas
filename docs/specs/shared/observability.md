# Observability

**Date:** 2026-05-18
**Status:** Current cross-cutting baseline

## Purpose

Define logging, metrics, tracing, and alerting expectations for production features.

## Logging

Application logs must be structured and include:

| Field | Rule |
| --- | --- |
| `timestamp` | UTC timestamp. |
| `level` | `debug`, `info`, `warn`, `error`. |
| `message` | Human-readable event description. |
| `correlationId` | Required when in request context. |
| `actorUserId` | Include when safe and available. |
| `tenantId` | Include when scoped and safe. |
| `businessId` | Include when scoped and safe. |
| `branchId` | Include when scoped and safe. |
| `operation` | Stable operation key. |

Do not log secrets, passwords, OTPs, access tokens, refresh tokens, provider secrets, or raw payment credentials.

## Metrics

Feature HLD or LLD docs must define metrics for high-risk or customer-facing flows.

| Metric type | Examples |
| --- | --- |
| Request metrics | latency, error rate, throughput by route. |
| Business metrics | bookings created, invoices finalized, stock adjustments. |
| Security metrics | login failures, MFA failures, lockouts, CSRF failures. |
| Integration metrics | provider latency, retry count, webhook failures. |
| Job metrics | job duration, failure count, backlog size. |

## Tracing

Distributed tracing should use the request correlation ID as the bridge between:

- API gateway or middleware;
- controller;
- service/use case;
- repository/adapter;
- external provider call;
- background follow-up task;
- audit record.

## Alerts

Production alerts should exist for:

- sustained 5xx rate;
- authentication attack signals;
- payment callback failures;
- notification delivery backlog;
- job retry exhaustion;
- database migration failure;
- tenant or branch data isolation violation detected by safeguards.

## Dashboards

At minimum, production dashboards should show:

- API health;
- Auth health;
- database health;
- queue/job health when queues are introduced;
- provider health;
- business-critical flow health for booking, checkout, and notifications.

## Test And Review Requirements

Feature PRs should verify:

- high-risk failures produce structured logs;
- correlation ID appears in logs and response envelopes;
- metrics names are stable;
- sensitive data is redacted.
