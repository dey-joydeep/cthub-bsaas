# Salon Owner User Stories

**Date:** 2026-05-11
**Status:** Product-owner draft
**Audience:** Product owner, business analyst, architect, designer, backend developer, frontend developer, QA.

## Purpose

This folder defines implementation-ready user stories from the perspective of a beauty salon owner or manager.

Use these docs as input for:

- HLD and LLD
- functional requirements
- non-functional requirements
- API contracts
- UI screen planning
- test strategy
- release slicing

## Product Assumptions

- Primary market: India-first beauty salon SaaS.
- Users may operate one branch or multiple branches.
- Daily operations include appointments, walk-ins, billing, staff assignment, commissions, inventory usage, packages, reminders, and customer retention.
- Payments must support common Indian salon flows: UPI, cash, card, split payment, refunds, pending dues, and GST invoices where applicable.
- Customer communication should support email and in-app notification, with WhatsApp/SMS as configurable channels.
- The product should remain useful for a small single-owner salon and scalable to a multi-branch salon group.

## Research Signals

Existing salon SaaS products commonly emphasize these capabilities:

- Appointment booking, billing, staff management, inventory, analytics, and online booking.
- GST invoicing, UPI/cash/card capture, WhatsApp reminders, and Google review collection.
- POS, customer CRM, marketing, staff roles, reporting, and multi-location operations.
- Waitlist, client notes, rebooking, promotions, memberships, loyalty, and service packages.

References used during analysis:

- Gloxi: https://gloxi.in/
- SalonBoost: https://salonboost.online/salon-software
- MioSalon: https://www.miosalon.com/beauty-salon-software
- Zenoti: https://grow.zenoti.com/salon/salon-management-software
- Fresha: https://www.fresha.com/for-business/features

## Feature Groups

| Feature group    | Primary screen or workflow                            | Story file                                                                                                    |
| ---------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Dashboard        | Owner daily command center                            | [owner-dashboard-user-stories.md](dashboard/owner-dashboard-user-stories.md)                                  |
| Appointments     | Calendar, booking, walk-in queue, no-show handling    | [appointment-and-walk-in-user-stories.md](appointments/appointment-and-walk-in-user-stories.md)               |
| Billing/POS      | Checkout, GST invoice, payment reconciliation         | [billing-pos-user-stories.md](billing-pos/billing-pos-user-stories.md)                                        |
| Customers        | Customer profile, notes, visit history, segmentation  | [customer-crm-user-stories.md](customers/customer-crm-user-stories.md)                                        |
| Services         | Service catalog, pricing, duration, add-ons           | [service-catalog-user-stories.md](services/service-catalog-user-stories.md)                                   |
| Staff            | Roles, shifts, attendance, commission, performance    | [staff-management-user-stories.md](staff/staff-management-user-stories.md)                                    |
| Inventory        | Retail stock, professional-use consumption, transfers | [inventory-consumption-user-stories.md](inventory/inventory-consumption-user-stories.md)                      |
| Packages/Loyalty | Prepaid packages, memberships, points, referrals      | [packages-memberships-loyalty-user-stories.md](packages-loyalty/packages-memberships-loyalty-user-stories.md) |
| Marketing        | Reminders, review requests, win-back campaigns        | [customer-retention-marketing-user-stories.md](marketing/customer-retention-marketing-user-stories.md)        |
| Branches         | Branch profile, hours, policies, tax/payment settings | [branch-settings-user-stories.md](branches/branch-settings-user-stories.md)                                   |
| Release scope    | MVP, V1, later-release split                          | [release-scope.md](release-scope.md)                                                                          |
| Screen map       | Screen/workflow responsibilities                      | [screen-map.md](screen-map.md)                                                                                |
| Backlog map      | Story IDs and downstream planning groups              | [backlog-map.md](backlog-map.md)                                                                              |

## Standard Story Template

Each feature doc should include:

- owner outcome
- actors
- screens/workflows
- user stories
- functional requirements
- business rules and edge cases
- acceptance criteria
- non-functional requirements
- downstream HLD/LLD hints

## MVP Priority

1. Dashboard
2. Appointments and walk-ins
3. Billing/POS
4. Customers
5. Services
6. Staff
7. Inventory
8. Branch settings
9. Packages/loyalty
10. Marketing/retention
