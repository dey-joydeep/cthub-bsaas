# Salon Owner Release Scope

**Date:** 2026-05-11
**Status:** Product-owner draft

## Purpose

This document slices the salon-owner user stories into release groups. It is not a commitment to delivery order; it gives product, architecture, and engineering a practical sequence for planning.

## MVP: Operational Core

The MVP should make a single-branch salon operationally credible.

| Area            | Included capabilities                                                            |
| --------------- | -------------------------------------------------------------------------------- |
| Dashboard       | Today's appointments, walk-ins, revenue snapshot, pending dues, low-stock alerts |
| Appointments    | Booking creation, calendar/day board, walk-in queue, reschedule, cancel, no-show |
| Billing/POS     | Checkout, invoice, UPI/cash/card capture, split payment, pending dues            |
| Customers       | Customer profile, search, visit history, notes, communication preference         |
| Services        | Service catalog, categories, duration, price, staff eligibility                  |
| Staff           | Staff profile, role, skill, shift, leave/block time                              |
| Inventory       | Retail stock, stock adjustment, low-stock alert                                  |
| Branch settings | Branch profile, business hours, holidays, cancellation policy                    |

MVP should avoid advanced automation where manual operation is acceptable.

## V1: Owner Control And Retention

V1 should reduce manual follow-up and improve revenue visibility.

| Area             | Included capabilities                                                   |
| ---------------- | ----------------------------------------------------------------------- |
| Dashboard        | Branch comparison, staff utilization, alert drawer                      |
| Appointments     | Confirmation/reminder automation, service sequencing, manager overrides |
| Billing/POS      | GST-ready invoice, refunds, daily closing, discount permissions         |
| Customers        | Segments, duplicate merge, restricted notes                             |
| Services         | Add-ons, branch-specific pricing, online visibility                     |
| Staff            | Attendance, commission rules, performance reports                       |
| Inventory        | Professional-use consumption, stock transfer, expiry/damage             |
| Packages/Loyalty | Prepaid packages, package redemption, loyalty points                    |
| Marketing        | Review request, birthday/anniversary offer, inactive-customer win-back  |
| Branch settings  | Tax/payment settings, notification templates, setting audit             |

## Later Releases

These capabilities are useful but should not block the operational core.

| Area                   | Capability                                                       |
| ---------------------- | ---------------------------------------------------------------- |
| Public discovery       | Public home page, salon marketplace, SEO landing pages           |
| Portfolio              | Before/after portfolio, style inspiration, staff portfolio       |
| Social/community       | Feed, follows, groups, discussions                               |
| Advanced marketing     | Campaign ROI, advanced segmentation, A/B testing                 |
| Advanced analytics     | Custom report builder, scheduled reports, forecasting            |
| Advanced inventory     | Barcode flow, vendor purchase orders, stock count mobile app     |
| Advanced finance       | Accounting exports, credit notes, formal tax filing integrations |
| Advanced customization | Theme builder, layout personalization                            |

## Release Guardrails

- Before releasing appointment booking, payment capture, or stock adjustment, QA must verify its concurrency invariant against the isolated PostgreSQL test database and retain the persisted-state evidence. The full operational-core MVP includes all three proofs; unfinished flows cannot be counted as passed.
- Before releasing a front-desk read flow, PO and QA must accept its staged HTTP workload and review measured latency and error evidence against [NFR-PERF-05](../../specs/salon-owner/FNRD/non-functional-requirements.md). A local database probe is diagnostic evidence only.
- Do not build marketing automation before consent and customer CRM foundations exist.
- Do not build commission payouts before POS finalization and refund rules are stable.
- Do not build advanced inventory before stock movement ledger rules are agreed.
- Do not build public marketplace discovery before branch/service/customer booking basics are reliable.
