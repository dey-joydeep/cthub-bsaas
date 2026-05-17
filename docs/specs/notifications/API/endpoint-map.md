# Notifications API Endpoint Map

**Date:** 2026-05-18
**Status:** Target planning contract

| Capability | Method | Path | Operation ID |
| --- | --- | --- | --- |
| List templates | `GET` | `/partner/notifications/templates` | `listNotificationTemplates` |
| Update template | `PATCH` | `/partner/notifications/templates/{id}` | `updateNotificationTemplate` |
| List delivery logs | `GET` | `/partner/notifications/deliveries` | `listNotificationDeliveries` |
| Get delivery detail | `GET` | `/partner/notifications/deliveries/{id}` | `getNotificationDelivery` |
| Update preferences | `PATCH` | `/me/preferences/communication` | `updateMyCommunicationPreferences` |
| List admin delivery logs | `GET` | `/admin/platform/notifications/deliveries` | `listPlatformNotificationDeliveries` |
