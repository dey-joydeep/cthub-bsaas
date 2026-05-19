# Customer App Test Specification

**Date:** 2026-05-18
**Status:** Current planning baseline

## Backend Tests

- Booking rejects unavailable slots.
- Booking rejects hidden services.
- Cancellation/reschedule follows branch policy.
- Receipts are visible only to the owning customer account.
- Review submission requires completed eligible appointment.

## Web Tests

- Dashboard renders next appointment and empty state.
- Booking flow handles validation and slot conflict.
- Cancel dialog shows policy impact.
- Mobile booking layout remains usable.
- SSR render avoids browser-only API access.

## E2E Candidates

- Public discovery to login to booking.
- Customer cancels appointment within allowed window.
- Customer submits review after completed appointment.
