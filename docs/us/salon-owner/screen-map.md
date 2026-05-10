# Salon Owner Screen Map

**Date:** 2026-05-11
**Status:** Product-owner draft

## Purpose

This document maps the salon-owner feature stories to screens and workflows. Designers and developers can use it to identify screen boundaries before HLD/LLD.

## Screen Inventory

| Screen/workflow           | Primary users              | Main responsibilities                               | Source stories                                                                    |
| ------------------------- | -------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------- |
| Owner dashboard           | Owner, branch manager      | Daily metrics, alerts, quick actions, branch filter | [Dashboard](dashboard/owner-dashboard-user-stories.md)                            |
| Calendar/day board        | Front desk, manager, staff | View bookings, staff timeline, status changes       | [Appointments](appointments/appointment-and-walk-in-user-stories.md)              |
| Booking form              | Front desk, customer later | Customer, services, staff, slot, notes, estimate    | [Appointments](appointments/appointment-and-walk-in-user-stories.md)              |
| Walk-in queue             | Front desk, manager        | Add walk-in, estimate wait, assign staff            | [Appointments](appointments/appointment-and-walk-in-user-stories.md)              |
| Appointment detail drawer | Front desk, staff          | Status, notes, history, reschedule/cancel actions   | [Appointments](appointments/appointment-and-walk-in-user-stories.md)              |
| Checkout/POS              | Cashier, front desk        | Bill services/products, discounts, tax, payment     | [Billing/POS](billing-pos/billing-pos-user-stories.md)                            |
| Invoice preview           | Cashier, customer          | Invoice review, print/download/send receipt         | [Billing/POS](billing-pos/billing-pos-user-stories.md)                            |
| Payment capture           | Cashier                    | UPI/cash/card/split payment, dues                   | [Billing/POS](billing-pos/billing-pos-user-stories.md)                            |
| Daily closing             | Manager, accountant        | Payment-mode totals, cash reconciliation            | [Billing/POS](billing-pos/billing-pos-user-stories.md)                            |
| Customer search           | Front desk, staff          | Search, create, identify duplicates                 | [Customers](customers/customer-crm-user-stories.md)                               |
| Customer profile          | Front desk, staff, owner   | Visit history, notes, dues, packages, consent       | [Customers](customers/customer-crm-user-stories.md)                               |
| Service catalog           | Owner, manager             | Service list, categories, active/inactive state     | [Services](services/service-catalog-user-stories.md)                              |
| Service editor            | Owner, manager             | Duration, price, tax, staff skill, add-ons          | [Services](services/service-catalog-user-stories.md)                              |
| Staff directory           | Owner, manager             | Staff list, status, branch, role                    | [Staff](staff/staff-management-user-stories.md)                                   |
| Staff profile             | Owner, manager             | Skills, shifts, access, attendance, commission      | [Staff](staff/staff-management-user-stories.md)                                   |
| Shift planner             | Manager                    | Working hours, leave, blocked time                  | [Staff](staff/staff-management-user-stories.md)                                   |
| Inventory dashboard       | Owner, manager             | Stock summary, low-stock alerts                     | [Inventory](inventory/inventory-consumption-user-stories.md)                      |
| Product catalog           | Owner, inventory staff     | Product master, tax, cost, retail price             | [Inventory](inventory/inventory-consumption-user-stories.md)                      |
| Stock movement            | Inventory staff            | Stock in/out, adjustment, transfer, damage          | [Inventory](inventory/inventory-consumption-user-stories.md)                      |
| Package catalog           | Owner, manager             | Package/session plans, expiry, price                | [Packages/Loyalty](packages-loyalty/packages-memberships-loyalty-user-stories.md) |
| Customer package wallet   | Front desk, customer later | Remaining balance, redemption history               | [Packages/Loyalty](packages-loyalty/packages-memberships-loyalty-user-stories.md) |
| Loyalty rules             | Owner                      | Points earning, redemption, referral rules          | [Packages/Loyalty](packages-loyalty/packages-memberships-loyalty-user-stories.md) |
| Campaign list             | Owner, marketing staff     | Campaigns, status, delivery summary                 | [Marketing](marketing/customer-retention-marketing-user-stories.md)               |
| Campaign builder          | Owner, marketing staff     | Segment, template, schedule, channel                | [Marketing](marketing/customer-retention-marketing-user-stories.md)               |
| Branch profile            | Owner, manager             | Address, map, contact, active status                | [Branches](branches/branch-settings-user-stories.md)                              |
| Branch policy settings    | Owner, manager             | Hours, holidays, cancellation, refund, deposit      | [Branches](branches/branch-settings-user-stories.md)                              |
| Tax/payment settings      | Owner, accountant          | GST, invoice prefix, payment modes, closing         | [Branches](branches/branch-settings-user-stories.md)                              |

## Navigation Notes

- Dashboard quick actions should route to booking, walk-in, checkout, customer search, staff attendance, and stock adjustment.
- Appointment completion should route to checkout with line items prefilled.
- Customer profile should deep-link to visit history, invoices, packages, notes, and communication preferences.
- Inventory alerts should deep-link to product stock details filtered by branch.
- Branch settings should be permission-protected and auditable.
