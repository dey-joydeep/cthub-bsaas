# Tenant, Business, And Branch Scoping

**Date:** 2026-05-18
**Status:** Current cross-cutting baseline

## Purpose

Define how data is owned and isolated across the SaaS platform. This prevents accidental cross-tenant, cross-business, or cross-branch data leakage.

## Scope Model

| Level            | Meaning                                                    | Owns                                                                  |
| ---------------- | ---------------------------------------------------------- | --------------------------------------------------------------------- |
| Platform         | CTHub BSaaS operator boundary.                             | Platform users, global configuration, platform audit.                 |
| Tenant           | SaaS subscription/account boundary.                        | Billing relationship, tenant status, subscription configuration.      |
| Salon business   | One salon business or legal registration under a tenant.   | Business settings, policies, customer profiles, services.             |
| Branch           | One physical or operational branch under a salon business. | Appointments, branch hours, stock balances, branch staff assignment.  |
| User             | Authenticated account identity.                            | Credentials, sessions, profile, preferences.                          |
| Customer profile | Business-owned customer record.                            | Visit history, notes, preferences, consent within one salon business. |

## Ownership Rules

| Rule ID   | Rule                                                                                                                        |
| --------- | --------------------------------------------------------------------------------------------------------------------------- |
| SCOPE-001 | Every tenant-owned record must carry a tenant identifier directly or through an immutable parent relationship.              |
| SCOPE-002 | Every salon operation record must resolve to exactly one salon business.                                                    |
| SCOPE-003 | Branch-operational records must resolve to exactly one branch.                                                              |
| SCOPE-004 | Customer profiles belong to one salon business and may have visits across branches of that business.                        |
| SCOPE-005 | A customer user may be linked to customer profiles across multiple salon businesses without merging business-owned records. |
| SCOPE-006 | Business settings may define defaults inherited by branches unless a feature FRD explicitly allows branch override.         |
| SCOPE-007 | Historical operational records must use snapshots for values that must not change after catalog or policy edits.            |
| SCOPE-008 | Cross-business reporting is allowed only for actors with platform or tenant-level authorization.                            |

## Query Requirements

Every repository or read model query must include the narrowest applicable scope filter:

| Query type           | Required filters                                                             |
| -------------------- | ---------------------------------------------------------------------------- |
| Platform admin query | Platform permission plus target tenant/business constraints when applicable. |
| Business owner query | Tenant and salon business.                                                   |
| Branch manager query | Tenant, salon business, and assigned branch set.                             |
| Staff query          | Tenant, salon business, assigned branch, and role/task permission.           |
| Customer query       | Auth user ID plus linked customer profile or own booking/payment relation.   |
| Public query         | Published visibility state and public-safe fields only.                      |

## Resource Identifier Rules

- External API IDs must be opaque UUID strings.
- APIs must not trust path IDs alone; services must re-check parent scope ownership.
- Slugs may be public only when the related resource is explicitly published.
- Internal database IDs must not be exposed if they reveal sequence, tenant size, or operational volume.

## Conflict And Leakage Rules

| Case                                                         | Required behavior                                                                  |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Resource exists outside actor scope                          | Return `404` unless the feature explicitly requires a support/admin denial reason. |
| Actor has branch access but target belongs to another branch | Return `403` or `404` according to feature leakage risk.                           |
| Branch override conflicts with business policy               | Return `409` with feature-specific conflict key.                                   |
| Customer linked to multiple businesses                       | Keep profiles separate; show only the profile in the current business context.     |

## Shared Server Primitives

Server routes that need common request-scope resolution can use `RequireScope`, `ScopeGuard`, and `CurrentScope` from `@cthub-bsaas/server-core`. The guard resolves tenant, business, and branch IDs from configured request locations, attaches the resolved scope to the request, and delegates business or branch membership checks to the injected `ScopeAccessEvaluator`.

## Diagram

See [tenant-scope-authorization-flow.drawio](DIAGRAMS/tenant-scope-authorization-flow.drawio).

## Testing Requirements

Each tenant-scoped feature must test:

- same business, allowed branch;
- same business, disallowed branch;
- different business under same tenant;
- different tenant;
- customer with profiles in multiple businesses;
- public route excluding private fields.
