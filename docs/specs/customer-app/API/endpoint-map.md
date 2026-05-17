# Customer App API Endpoint Map

**Date:** 2026-05-18
**Status:** Target planning contract

| Capability | Method | Path | Operation ID |
| --- | --- | --- | --- |
| Dashboard | `GET` | `/customer/dashboard` | `getCustomerDashboard` |
| Start booking context | `GET` | `/customer/booking/context` | `getCustomerBookingContext` |
| Create booking | `POST` | `/customer/bookings` | `createCustomerBooking` |
| List appointments | `GET` | `/customer/appointments` | `listCustomerAppointments` |
| Reschedule appointment | `POST` | `/customer/appointments/{id}/reschedule` | `rescheduleCustomerAppointment` |
| Cancel appointment | `POST` | `/customer/appointments/{id}/cancel` | `cancelCustomerAppointment` |
| List favorites | `GET` | `/customer/favorites` | `listCustomerFavorites` |
| Update favorite | `PUT` | `/customer/favorites/{targetType}/{targetId}` | `upsertCustomerFavorite` |
| List rewards | `GET` | `/customer/rewards` | `listCustomerRewards` |
| List receipts | `GET` | `/customer/receipts` | `listCustomerReceipts` |
| Submit review | `POST` | `/customer/reviews` | `submitCustomerReview` |

## OpenAPI Rule

Before implementation, these operations must be represented in a customer app OpenAPI contract or reconciled into owning feature OpenAPI contracts.
