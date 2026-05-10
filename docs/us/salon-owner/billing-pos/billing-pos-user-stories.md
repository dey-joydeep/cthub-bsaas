# Billing, POS, And Payment User Stories

**Date:** 2026-05-11
**Status:** Product-owner draft

## Owner Outcome

As a salon owner, I want fast and accurate checkout with GST-ready invoices and payment reconciliation so that revenue is collected correctly and staff cannot lose track of dues.

## Actors

- Salon Owner
- Branch Manager
- Cashier or Front Desk Staff
- Customer
- Accountant

## Primary Screens

- Checkout/POS
- Invoice preview
- Payment capture
- Refund dialog
- Daily closing
- Pending dues report

## User Stories

### POS-US-001: Checkout completed visit

As a cashier, I want to convert completed services and retail products into a bill so that the customer can pay without re-entering visit details.

### POS-US-002: GST invoice

As a salon owner, I want GST-ready invoice fields and numbering so that accounting and compliance work is easier.

### POS-US-003: Multiple payment modes

As a cashier, I want to capture UPI, cash, card, wallet/package, coupon, and split payment so that customers can pay using common local methods.

### POS-US-004: Pending dues

As a salon owner, I want to track partial payments and pending dues so that unpaid amounts are followed up.

### POS-US-005: Daily closing

As a branch manager, I want daily closing totals by payment mode and cashier so that cash and digital collections can be reconciled.

## Functional Requirements

- Create invoice from appointment, walk-in, retail sale, package sale, or membership sale.
- Support line items for services, products, packages, membership, discounts, taxes, tips, fees, refunds, and adjustments.
- Support UPI, cash, card, online gateway, wallet/package balance, coupon, and split payment.
- Support partial payment and mark balance as due.
- Generate invoice number according to branch/accounting configuration.
- Capture GSTIN and tax breakdown when applicable.
- Support refund, void, and correction flows with permissions.
- Send receipt via email and configured messaging channel.

## Business Rules And Edge Cases

- Invoice totals must be immutable after finalization; corrections should create adjustment or credit note records.
- Refunds must reference original invoice and payment mode.
- Discount permissions may vary by role and maximum allowed percentage.
- Cash drawer closing must compare expected cash with counted cash.
- Staff commission should be calculated from finalized bill rules, not appointment estimate.
- Package redemption should reduce available sessions or value at checkout.
- Pending dues must be visible in customer profile and owner dashboard.

## Acceptance Criteria

- Given a completed appointment, when I open checkout, then service lines, assigned staff, duration, and customer are prefilled.
- Given a customer pays partly by UPI and partly by cash, when I save payment, then the invoice records both modes.
- Given GST is enabled for the branch, when I finalize invoice, then the invoice includes tax breakdown and configured invoice number.
- Given a customer pays less than total, when I save, then remaining amount is marked due and appears in pending dues.
- Given a cashier attempts a refund without permission, when they submit, then the system blocks the action and records an audit event.

## Non-Functional Requirements

- Checkout should support front-desk tablet/desktop usage with minimal typing.
- Payment records must be strongly consistent with invoice records.
- Financial changes must be audit logged.
- Invoice PDF/print output must be deterministic and reproducible.

## HLD/LLD Hints

- Treat invoice, payment, refund, and daily closing as separate domain concepts.
- Define immutable invoice finalization rules early.
- Keep tax calculation isolated behind a service for future compliance changes.
