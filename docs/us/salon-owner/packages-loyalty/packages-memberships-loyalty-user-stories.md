# Packages, Memberships, And Loyalty User Stories

**Date:** 2026-05-11
**Status:** Product-owner draft

## Owner Outcome

As a salon owner, I want packages, memberships, loyalty, and referrals so that customers return more often and prepaid revenue is tracked correctly.

## Actors

- Salon Owner
- Branch Manager
- Front Desk Staff
- Customer
- Accountant

## Primary Screens

- Package catalog
- Membership plan editor
- Loyalty rules
- Customer package wallet
- Redemption at checkout
- Referral tracking

## User Stories

### PKG-US-001: Prepaid package

As a salon owner, I want to sell prepaid service packages so that customers commit to future visits and staff can redeem sessions correctly.

### PKG-US-002: Membership plan

As a salon owner, I want monthly or annual memberships with benefits so that recurring customers receive predictable perks.

### PKG-US-003: Loyalty points

As a salon owner, I want configurable loyalty points on visits or spend so that repeat purchases are encouraged.

### PKG-US-004: Referral reward

As a salon owner, I want referral tracking so that customers can bring new customers and rewards are issued only after valid conversion.

## Functional Requirements

- Define package by services, session count/value, price, expiry, branch scope, transferability, and redemption rules.
- Sell package from POS and attach it to customer account.
- Redeem package at checkout with remaining balance/session update.
- Define membership benefits: discount, free service, priority booking, birthday reward, or points multiplier.
- Define loyalty earning and redemption rules.
- Track referrals by code/link and reward status.

## Business Rules And Edge Cases

- Package redemption must not exceed remaining session/value balance.
- Expired packages cannot be redeemed unless owner override is recorded.
- Refund of package sale must reverse or freeze unused benefit according to policy.
- Loyalty points should be earned from finalized invoices only.
- Referral reward should be issued after first eligible paid visit, not only registration.
- Benefits must be branch-scoped when configured.

## Acceptance Criteria

- Given a customer buys a 6-session facial package, when one session is redeemed, then remaining sessions become 5.
- Given a package is expired, when cashier tries to redeem it, then redemption is blocked unless owner override is allowed.
- Given loyalty rules award points on net paid amount, when invoice finalizes, then points are calculated after discount and excluding tax if configured.
- Given a referred customer completes an eligible paid visit, when the bill is finalized, then referral reward becomes available.

## Non-Functional Requirements

- Package and loyalty balances must be transactionally consistent with invoices.
- Customer-facing balances must be clear and auditable.
- Financial liability from prepaid packages should be reportable.

## HLD/LLD Hints

- Treat package balances like a ledger.
- Keep loyalty rules versioned.
- Define redemption priority when multiple benefits apply.
