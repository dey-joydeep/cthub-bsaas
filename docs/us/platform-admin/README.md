# Platform Admin User Stories

**Date:** 2026-05-11
**Status:** Current planning source

## Owner Outcome

As a platform admin, I want to provision salons, manage tenants, monitor system health, and support customers securely so that the SaaS can operate reliably across many salon businesses.

## Actors

- Platform Admin
- Support Admin
- Salon Owner

## Primary Screens Or Workflows

- Platform dashboard
- Salon onboarding/provisioning
- Tenant and branch administration
- User and role administration
- Feature flags and platform settings
- Audit and support tools

## User Stories

### PADM-US-001: Platform dashboard

As a platform admin, I want active salons, users, revenue signals, errors, and system health in one view so that I can monitor platform operations.

### PADM-US-002: Salon provisioning

As a platform admin, I want to create and activate salon accounts with owner onboarding so that new businesses can start using the platform.

### PADM-US-003: Tenant oversight

As a platform admin, I want to view salon branches, status, contact details, and configuration so that support issues can be resolved.

### PADM-US-004: Support access

As a support admin, I want permission-scoped support views with audit logging so that I can assist without overreaching into private business data.

### PADM-US-005: Platform configuration

As a platform admin, I want feature flags, maintenance mode, and global configuration so that releases and incidents can be managed safely.

## Functional Requirements

- Show platform health, active tenants, active users, error signals, and support alerts.
- Create salon and first owner onboarding flow.
- Manage salon status: pending, active, suspended, inactive.
- View branch/contact/configuration metadata.
- Provide support impersonation or support-view only if explicitly designed with audit controls.
- Manage global feature flags and maintenance notices.
- Show access logs and high-risk admin actions.

## Business Rules And Edge Cases

- Platform admin actions are high risk and require strong auth and audit.
- Support access must never expose secrets or payment credentials.
- Salon suspension must block new operations according to policy while preserving data.
- Tenant provisioning must be idempotent or recoverable after partial failure.

## Acceptance Criteria

- Given I create a salon, when provisioning succeeds, then the owner onboarding path is created and audit logged.
- Given I suspend a salon, when users attempt restricted operations, then access is blocked according to policy.
- Given support views customer data, when the view opens, then the access reason and audit event are recorded.
- Given maintenance mode is enabled, when users access affected apps, then they see configured maintenance messaging.

## Non-Functional Requirements

- Admin screens require mandatory MFA.
- Every admin mutation must be audited with correlation ID.
- Platform dashboard should degrade gracefully if one telemetry source is unavailable.
- Feature flags must be safe-by-default.
