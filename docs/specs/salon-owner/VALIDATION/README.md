# Salon Owner Validation Index

**Date:** 2026-05-12
**Status:** Implementation baseline

## Purpose

Index the shared and feature-specific validation contracts for Salon Owner MVP. Backend services must enforce these rules authoritatively. Frontend forms must mirror them for user experience.

## Source Documents

- [OpenAPI Contract](../API/openapi.yaml)
- [Business Rules](../FRD/business-rules.md)
- [Permissions Matrix](../FRD/permissions-matrix.md)
- [MVP LLD](../LLD/mvp-lld.md)
- [Web LLD](../WEB/web-lld.md)

## Validation Documents

| Document                                                          | Scope                                                               |
| ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| [Shared Validation And Control](shared-validation-and-control.md) | Common ownership, controls, validation timing, errors, idempotency. |
| [Business Settings Validation](business-settings-validation.md)   | Business profile and legal registration forms.                      |
| [Branch Settings Validation](branch-settings-validation.md)       | Branch profile, hours, holidays, policies.                          |
| [Staff Validation](staff-validation.md)                           | Staff profile, roles, skills, shifts, leave blocks.                 |
| [Service Catalog Validation](service-catalog-validation.md)       | Categories, services, staff eligibility, branch overrides.          |
| [Customer CRM Validation](customer-crm-validation.md)             | Customer profile, notes, communication preferences.                 |
| [Appointment Validation](appointment-validation.md)               | Booking, walk-in, reschedule, cancel, no-show, status actions.      |
| [POS Validation](pos-validation.md)                               | Invoice draft, invoice finalization, payment capture.               |
| [Inventory Validation](inventory-validation.md)                   | Product, stock movement, adjustment, low-stock filters.             |
| [Dashboard Validation](dashboard-validation.md)                   | Dashboard filters and read-model scope validation.                  |

## Required Per-Form Details

Every feature validation file must define:

- screen ID;
- form ID;
- actors;
- required context;
- create/edit differences;
- submit operation;
- idempotency requirement;
- field controls;
- defaults;
- enabled/disabled rules;
- dependent field behavior;
- client validation;
- backend DTO/service validation;
- cross-field validation;
- error message keys;
- conflict behavior;
- validation test mapping.
