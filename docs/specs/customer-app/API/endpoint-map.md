# Customer App API Endpoint Map

**Date:** 2026-05-18
**Status:** Traceability index for project-wide OpenAPI

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

These operations are represented in [Project-Wide Supporting OpenAPI](../../project-wide/API/openapi.yaml). This endpoint map remains the feature traceability index.
