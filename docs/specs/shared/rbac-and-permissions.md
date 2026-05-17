# RBAC And Permissions

**Date:** 2026-05-18
**Status:** Current cross-cutting baseline

## Purpose

Define project-wide authorization rules across platform admin, salon owner, staff, and customer actors. Feature-specific permission matrices may add detail, but must use this document as the common model.

## Source Inputs

- [User story status matrix](../../us/status-matrix.md)
- [Salon Owner permissions matrix](../salon-owner/FRD/permissions-matrix.md)
- [Auth API contract](../auth/API/openapi.yaml)
- [Tenant, Business, And Branch Scoping](tenant-business-branch-scoping.md)

## Actor Families

| Actor family | Description | Scope root |
| --- | --- | --- |
| Platform owner | SaaS operator with platform-wide administration responsibility. | Platform |
| Platform support | Support user with restricted operational assistance permissions. | Platform, tenant, or business based on assignment |
| Salon business owner | Owns one legal salon business and may operate one or more branches. | Salon business |
| Branch manager | Manages one or more assigned branches under a salon business. | Branch |
| Staff user | Receptionist, stylist, cashier, accountant, or other branch staff. | Assigned branch and task scope |
| Customer user | End customer who books, pays, reviews, and manages own profile. | Own user account and linked customer profiles |
| Anonymous visitor | Public unauthenticated visitor. | Public data only |

## Permission Scope Levels

| Scope | Meaning | Example |
| --- | --- | --- |
| Platform | Can act across tenants according to platform policy. | Suspend a tenant, inspect audit logs. |
| Tenant | Can act within one SaaS tenant/account boundary. | Tenant billing and account state. |
| Business | Can act within one salon business/legal registration. | Configure cancellation policy. |
| Branch | Can act within one or more branches. | Manage appointments for assigned branch. |
| Staff self | Can act on own staff profile or schedule subset. | View assigned appointments. |
| Customer self | Can act on own customer account and linked profile. | View appointment history. |
| Public | Can read public, published data only. | Search salons. |

## Authorization Decision Order

Every protected operation must evaluate authorization in this order:

1. Authenticate the actor unless the route is explicitly public.
2. Resolve actor role assignments from the current session.
3. Resolve requested tenant, business, branch, customer, or resource scope.
4. Confirm the actor has access to that scope.
5. Confirm the actor has the operation permission in that scope.
6. Confirm the target resource is in the same allowed scope.
7. Confirm state-specific restrictions, such as immutable invoices or closed appointments.
8. Execute the operation and write audit records when required.

The server is authoritative. UI hiding or disabled buttons must not replace server authorization.

## Permission Result Rules

| Case | HTTP result | Message key family |
| --- | --- | --- |
| Missing authentication | `401` | `auth.error.*` |
| Authenticated but outside scope | `403` | `common.error.forbidden.scope` |
| Authenticated but operation denied | `403` | `common.error.forbidden.permission` |
| Target resource does not exist in allowed scope | `404` | `common.error.not_found` |
| Operation not allowed in current resource state | `409` | `<feature>.error.conflict.*` |
| Validation failure after authorization | `422` | `<feature>.validation.*` |

Use `404` instead of `403` when revealing the resource existence would leak cross-tenant or cross-business data.

## Feature Matrix Requirements

Every feature FRD or validation spec that includes protected actions must document:

- actor family;
- minimum role;
- required scope;
- permitted operations;
- readonly states;
- hidden vs disabled UI behavior;
- server-side rejection behavior;
- audit requirement.

## Testing Requirements

Each feature must include tests for:

- unauthenticated access;
- wrong tenant/business/branch scope;
- missing operation permission;
- role with read-only permission attempting write;
- state-specific conflict;
- public data not exposing private fields.
