# API Conventions

**Date:** 2026-05-18
**Status:** Current cross-cutting baseline

## Purpose

Define shared REST API conventions for all backend features and frontend clients.

## Source Inputs

- [Shared HLD Baselines](hld-baselines.md)
- [Auth OpenAPI](../auth/API/openapi.yaml)
- [Salon Owner OpenAPI](../salon-owner/API/openapi.yaml)
- [Error Message Catalog](error-message-catalog.md)

## Response Envelope

Successful JSON responses must use:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "correlationId": "c-01HZZ..."
  }
}
```

Error JSON responses must use:

```json
{
  "success": false,
  "code": "feature.error.reason",
  "message": "Human-readable fallback message",
  "details": [],
  "meta": {
    "correlationId": "c-01HZZ..."
  }
}
```

`message` is a fallback. Frontends should localize by `code` when a matching message key exists.

## Correlation ID

- Clients may send `X-Correlation-Id`.
- The API must return `X-Correlation-Id` in responses.
- Error and success envelopes must include `meta.correlationId` when available.
- Logs, audit records, and background follow-up work must propagate the same correlation ID when practical.

## HTTP Status Usage

| Status | Use |
| --- | --- |
| `200` | Successful read or command with immediate response. |
| `201` | Resource created. |
| `202` | Accepted for asynchronous processing. |
| `204` | Successful empty response only when the endpoint contract explicitly avoids envelopes. |
| `302` | OAuth or external-provider redirect. |
| `400` | Malformed body, invalid content type, or invalid request shape before DTO validation. |
| `401` | Missing or invalid authentication. |
| `403` | Authenticated but denied by CSRF, permission, or scope. |
| `404` | Resource not found or hidden because it is outside scope. |
| `409` | Valid request conflicts with current state or concurrency rules. |
| `410` | Expired token, challenge, link, or invitation. |
| `422` | Field or semantic validation failure. |
| `429` | Rate limited or attempt budget exhausted. Must include `Retry-After` when applicable. |
| `500` | Unexpected server failure. |

## Pagination

List endpoints must use cursor pagination unless the feature explicitly documents offset pagination.

Required request fields:

| Field | Rule |
| --- | --- |
| `limit` | Integer, default `25`, max `100` unless feature overrides. |
| `cursor` | Opaque string from previous response. |
| `sort` | Whitelisted sort key. |
| `direction` | `asc` or `desc`, default per endpoint. |

Required response metadata:

```json
{
  "page": {
    "limit": 25,
    "nextCursor": "opaque-or-null",
    "hasMore": true
  }
}
```

## Filtering And Sorting

- APIs must whitelist filter and sort fields.
- Unknown filters must return `422`.
- Date filters must use UTC ISO-8601 strings.
- Money and decimal values must be strings at API boundaries.
- Free-text search must document minimum length, normalization, and fields searched.

## Idempotency

Write endpoints that create financial records, appointments, external calls, notifications, or imports must support idempotency.

| Header | Rule |
| --- | --- |
| `Idempotency-Key` | Required for high-risk creates and provider callback processing. |

Services must store enough request fingerprint information to reject conflicting reuse of the same key.

## Versioning

- Prefer additive changes.
- Breaking changes require versioned DTOs or route versioning.
- Deprecated fields must be documented with migration guidance.
- OpenAPI must be updated before implementation PRs are merged.

## Diagram

See [api-request-lifecycle.drawio](DIAGRAMS/api-request-lifecycle.drawio).
