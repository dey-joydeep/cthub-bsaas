# Customer App Validation And Controls

**Date:** 2026-05-18
**Status:** Current planning baseline

## Forms

| Form ID                                | Submit operation                |
| -------------------------------------- | ------------------------------- |
| `customer.booking.form`                | `createCustomerBooking`         |
| `customer.appointment.reschedule.form` | `rescheduleCustomerAppointment` |
| `customer.appointment.cancel.dialog`   | `cancelCustomerAppointment`     |
| `customer.review.form`                 | `submitCustomerReview`          |

## Rules

| Rule ID      | Field/control | Rule                                             | Error key                                            |
| ------------ | ------------- | ------------------------------------------------ | ---------------------------------------------------- |
| CUST-VAL-001 | `serviceIds`  | At least one online-visible service is required. | `customer_app.booking.validation.service_required`   |
| CUST-VAL-002 | `branchId`    | Branch must be active and public-bookable.       | `customer_app.booking.validation.branch_unavailable` |
| CUST-VAL-003 | `startAt`     | Slot must be available when submitted.           | `customer_app.booking.error.slot_conflict`           |
| CUST-VAL-004 | `notes`       | Max 1000 characters, no control characters.      | `customer_app.booking.validation.notes_invalid`      |
| CUST-VAL-005 | `rating`      | Integer 1 through 5.                             | `customer_app.review.validation.rating_invalid`      |
| CUST-VAL-006 | `reviewText`  | Max 2000 characters and only for eligible visit. | `customer_app.review.validation.text_invalid`        |

## Backend Enforcement

Backend must re-check all availability, visibility, customer ownership, and policy rules on submit.
