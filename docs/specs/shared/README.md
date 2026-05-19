# Shared Cross-Cutting Specs

**Date:** 2026-05-18
**Status:** Current cross-cutting baseline

## Purpose

This folder defines project-wide rules that every feature spec and implementation must follow. Feature docs may add stricter rules, but must not contradict these shared baselines without updating this folder first.

## Documents

| Document | Purpose |
| --- | --- |
| [RBAC And Permissions](rbac-and-permissions.md) | Actor roles, permission scopes, and operation authorization rules. |
| [Tenant, Business, And Branch Scoping](tenant-business-branch-scoping.md) | Data ownership and isolation rules across the SaaS platform. |
| [API Conventions](api-conventions.md) | Envelopes, pagination, filtering, idempotency, correlation IDs, and versioning. |
| [Error Message Catalog](error-message-catalog.md) | Message-key naming, error code families, and mapping rules. |
| [Audit Logging](audit-logging.md) | Required audit fields, lifecycle, retention, and review rules. |
| [Observability](observability.md) | Logging, metrics, tracing, dashboards, and alerting expectations. |
| [Security Hardening](security-hardening.md) | Headers, CORS, CSRF, cookies, rate limits, secrets, and dependency review. |
| [Testing Strategy](testing-strategy.md) | Unit, integration, e2e, contract, accessibility, performance, and coverage expectations. |
| [E2E Foundation](e2e-foundation.md) | Minimal e2e structure and rules before full scenario expansion. |
| [Migration And Rollout Policy](migration-rollout-policy.md) | Database, API, feature flag, and deployment safety rules. |
| [Project-Wide Implementation Specs](../project-wide/README.md) | Final supporting OpenAPI contract and implementation slicing plan for non-auth, non-Salon Owner project-wide areas. |

## Visual Artifacts

| Diagram | Purpose |
| --- | --- |
| [Tenant scope authorization flow](DIAGRAMS/tenant-scope-authorization-flow.drawio) | Shows how actor, tenant, business, branch, and permission checks compose. |
| [API request lifecycle](DIAGRAMS/api-request-lifecycle.drawio) | Shows request handling from edge middleware through controller, service, persistence, audit, and response envelope. |
| [Migration rollout lifecycle](DIAGRAMS/migration-rollout-lifecycle.drawio) | Shows safe migration and rollout stages. |

## Implementation Rule

Developers must read the relevant shared document before implementing a feature that touches the same concern. For example, every new API endpoint must follow [API Conventions](api-conventions.md), every write operation must consider [Audit Logging](audit-logging.md), and every tenant-scoped query must follow [Tenant, Business, And Branch Scoping](tenant-business-branch-scoping.md).
