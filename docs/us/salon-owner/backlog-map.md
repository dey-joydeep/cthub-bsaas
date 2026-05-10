# Salon Owner Backlog Map

**Date:** 2026-05-11
**Status:** Product-owner draft

## Purpose

This document gathers story IDs from the salon-owner pack into a backlog-oriented map. It helps future sessions convert user stories into HLD, LLD, API contracts, UI tasks, and QA cases.

## Story Groups

| Group            | Story IDs                         | Source                                                                                              |
| ---------------- | --------------------------------- | --------------------------------------------------------------------------------------------------- |
| Dashboard        | DASH-US-001 through DASH-US-004   | [Owner Dashboard](dashboard/owner-dashboard-user-stories.md)                                        |
| Appointments     | APPT-US-001 through APPT-US-005   | [Appointments And Walk-Ins](appointments/appointment-and-walk-in-user-stories.md)                   |
| Billing/POS      | POS-US-001 through POS-US-005     | [Billing/POS](billing-pos/billing-pos-user-stories.md)                                              |
| Customer CRM     | CRM-US-001 through CRM-US-004     | [Customer CRM](customers/customer-crm-user-stories.md)                                              |
| Services         | SVC-US-001 through SVC-US-004     | [Service Catalog](services/service-catalog-user-stories.md)                                         |
| Staff            | STAFF-US-001 through STAFF-US-004 | [Staff Management](staff/staff-management-user-stories.md)                                          |
| Inventory        | INV-US-001 through INV-US-004     | [Inventory And Consumption](inventory/inventory-consumption-user-stories.md)                        |
| Packages/Loyalty | PKG-US-001 through PKG-US-004     | [Packages, Memberships, And Loyalty](packages-loyalty/packages-memberships-loyalty-user-stories.md) |
| Marketing        | MKT-US-001 through MKT-US-005     | [Customer Retention And Marketing](marketing/customer-retention-marketing-user-stories.md)          |
| Branches         | BR-US-001 through BR-US-005       | [Branch And Salon Settings](branches/branch-settings-user-stories.md)                               |

## Suggested HLD Packages

| HLD package                | Inputs                                               |
| -------------------------- | ---------------------------------------------------- |
| Owner Operations HLD       | Dashboard, appointments, walk-ins, branch settings   |
| Billing And Finance HLD    | Billing/POS, packages, loyalty, tax/payment settings |
| Customer And Retention HLD | Customer CRM, marketing, review requests, packages   |
| Staff And Capacity HLD     | Staff, services, appointment slotting                |
| Inventory HLD              | Product catalog, stock movement, service consumption |

## Suggested LLD/API Packages

| LLD/API package        | Candidate endpoints or modules                                               |
| ---------------------- | ---------------------------------------------------------------------------- |
| Appointment lifecycle  | Slot search, booking create/update, status transition, cancellation, no-show |
| POS lifecycle          | Invoice draft, invoice finalize, payment capture, refund, pending due        |
| Customer CRM           | Customer search, profile, notes, merge, consent, segments                    |
| Service catalog        | Service/category CRUD, branch override, staff eligibility                    |
| Staff operations       | Staff profile, role, shift, leave, attendance, commission                    |
| Inventory ledger       | Product master, stock movement, transfer, consumption, stock alert           |
| Branch settings        | Branch profile, hours, holidays, policies, tax/payment settings              |
| Notification/campaigns | Template, campaign, audience, send queue, delivery status                    |

## QA Planning Notes

- Use acceptance criteria in each feature doc as the starting point for functional test cases.
- Add cross-feature tests for appointment-to-checkout, package redemption, stock consumption, and staff commission.
- Add permission tests for owner, branch manager, front desk, cashier, service staff, and accountant.
- Add concurrency tests for slot booking and stock movement.
- Add audit tests for financial changes, settings changes, overrides, and restricted notes.
