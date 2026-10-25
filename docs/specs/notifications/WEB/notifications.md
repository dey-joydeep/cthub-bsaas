# Notifications Web Specification

**Date:** 2026-05-18
**Status:** Current planning baseline

## Routes

| Route                                        | Screen ID                     |
| -------------------------------------------- | ----------------------------- |
| `/partner/settings/notifications/templates`  | `notifications.templates`     |
| `/partner/settings/notifications/deliveries` | `notifications.deliveryLog`   |
| `/account/preferences`                       | `notifications.myPreferences` |
| `/admin/platform/notifications`              | `notifications.platformLog`   |

## Screen Requirements

- Template editor must show approved variables and preview.
- Delivery log must filter by date, channel, status, recipient, and correlation ID.
- Preferences screen must distinguish transactional and marketing channels.
- Provider failure states must be visible but must not expose secrets.
