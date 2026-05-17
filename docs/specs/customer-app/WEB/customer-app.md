# Customer App Web Specification

**Date:** 2026-05-18
**Status:** Current planning baseline

## Routes

| Route | Screen ID |
| --- | --- |
| `/customer` | `customer.dashboard` |
| `/customer/book` | `customer.booking.flow` |
| `/customer/appointments` | `customer.appointments.list` |
| `/customer/rewards` | `customer.rewards` |
| `/customer/receipts` | `customer.receipts` |
| `/customer/reviews` | `customer.reviews` |

## Screen Requirements

- Dashboard must prioritize next appointment and quick rebooking.
- Booking flow must be mobile-first with stepper or compact staged sections.
- Appointment actions must show policy impact before confirmation.
- Rewards must distinguish points, package balances, expiry, and referral rewards.
- Receipts must expose invoice/payment/refund status and pending dues.

## States

Every screen must include loading, empty, forbidden, validation, conflict, and server-error states where applicable.
