# Notifications API Endpoint Map

**Date:** 2026-05-18
**Status:** Traceability index for project-wide OpenAPI

These operations are represented in [Project-Wide Supporting OpenAPI](../../project-wide/API/openapi.yaml). This endpoint map remains the feature traceability index.

| Capability               | Method  | Path                                       | Operation ID                         |
| ------------------------ | ------- | ------------------------------------------ | ------------------------------------ |
| List templates           | `GET`   | `/partner/notifications/templates`         | `listNotificationTemplates`          |
| Update template          | `PATCH` | `/partner/notifications/templates/{id}`    | `updateNotificationTemplate`         |
| List delivery logs       | `GET`   | `/partner/notifications/deliveries`        | `listNotificationDeliveries`         |
| Get delivery detail      | `GET`   | `/partner/notifications/deliveries/{id}`   | `getNotificationDelivery`            |
| Update preferences       | `PATCH` | `/me/preferences/communication`            | `updateMyCommunicationPreferences`   |
| List admin delivery logs | `GET`   | `/admin/platform/notifications/deliveries` | `listPlatformNotificationDeliveries` |
