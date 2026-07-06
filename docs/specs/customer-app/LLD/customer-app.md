# Customer App LLD

**Date:** 2026-05-18
**Status:** Current planning baseline

## Suggested Modules

| Module                        | Responsibility                                                                    |
| ----------------------------- | --------------------------------------------------------------------------------- |
| `web-customer-shell`          | Customer app route composition and shell.                                         |
| `web-customer-booking`        | Booking flow state, API services, forms.                                          |
| `web-customer-profile`        | Customer dashboard/profile/rewards/receipts UI.                                   |
| `server-feature-customer-app` | Customer-safe orchestration endpoints where direct feature APIs are not suitable. |

## Commands And Queries

| Operation                       | Type    | Notes                                                                  |
| ------------------------------- | ------- | ---------------------------------------------------------------------- |
| `getCustomerDashboard`          | Query   | Upcoming appointment, recent visits, rewards, notification highlights. |
| `createCustomerBooking`         | Command | Uses appointment availability and policy checks.                       |
| `rescheduleCustomerAppointment` | Command | Enforces cancellation/reschedule policy.                               |
| `cancelCustomerAppointment`     | Command | Shows penalty/deposit impact before confirmation.                      |
| `listCustomerReceipts`          | Query   | Customer-visible invoice/payment records.                              |
| `submitCustomerReview`          | Command | Delegates eligibility and moderation state.                            |

## Transaction Rules

- Booking create must reserve or create appointment atomically according to appointment implementation.
- Cancellation must persist state change and customer-visible audit event together.
- Review submission must bind to one eligible completed appointment.

## Test Implications

Tests must cover concurrent booking conflict, cancellation policy, customer data isolation, review eligibility, and mobile-first web behavior.
