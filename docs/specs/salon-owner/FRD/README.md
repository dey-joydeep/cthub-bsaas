# Salon Owner FRD Index

**Date:** 2026-05-11
**Status:** Implementation baseline

## Purpose

This folder is the authoritative functional requirement layer for the Salon Owner platform scope. It refines the user stories into binding business behavior before HLD, LLD, OpenAPI, database design, and tests are implemented.

## Source Inputs

- [Salon Owner User Stories](../../../us/salon-owner/README.md)
- [Salon Owner Release Scope](../../../us/salon-owner/release-scope.md)
- [Salon Owner Screen Map](../../../us/salon-owner/screen-map.md)
- [Cross-Cutting NFRs](../../../us/cross-cutting/non-functional-user-stories.md)
- [Data Privacy And Governance](../../../us/data-privacy/README.md)

## Functional Requirement Documents

| Document                                                | Responsibility                                                               |
| ------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [Business Operating Model](business-operating-model.md) | Tenant, salon business, legal registration, branch, and configuration model. |
| [Business Rules](business-rules.md)                     | Binding rules for branch, staff, service, customer, appointment, POS, stock. |
| [Permissions Matrix](permissions-matrix.md)             | Role and scope rules for owner, manager, front desk, service staff, cashier. |
| [Business Settings](business-settings.md)               | Tenant-level business profile and policy requirements.                       |
| [Branch Settings](branch-settings.md)                   | Branch profile, hours, holidays, and branch policy requirements.             |
| [Staff](staff.md)                                       | Staff profile, role, assignment, skills, and schedule requirements.          |
| [Service Catalog](service-catalog.md)                   | Service category, pricing, duration, availability, and status requirements.  |
| [Customer CRM](customer-crm.md)                         | Customer profile, consent, visit history, note, and merge requirements.      |
| [Appointment](appointment.md)                           | Appointment lifecycle, availability, booking, and conflict requirements.     |
| [POS](pos.md)                                           | Checkout, invoice, payment, dues, discount, and refund requirements.         |
| [Inventory](inventory.md)                               | Product, stock, supplier, movement, and low-stock requirements.              |
| [Dashboard](dashboard.md)                               | Owner and manager reporting, metrics, and alert requirements.                |

## Authority

Implementation must follow this precedence when documents disagree:

1. User story acceptance criteria and release scope.
2. FRD business rules and permissions.
3. FNRD non-functional requirements.
4. HLD architecture.
5. LLD module/service design.
6. OpenAPI transport contract.
7. Test strategy.

When a business rule and a technical design disagree, update the business rule first, then update HLD/LLD/API/tests.

## Requirement Language

- `must` and `must not` are binding.
- `is allowed only when` defines a required guard condition.
- `returns 409`, `returns 403`, or similar response wording defines required API behavior.
- Advisory language is not valid for business rules.
