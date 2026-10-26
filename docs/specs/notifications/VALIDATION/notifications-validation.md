# Notifications Validation And Controls

**Date:** 2026-05-18
**Status:** Current planning baseline

| Rule ID       | Field          | Rule                                                        | Error key                                       |
| ------------- | -------------- | ----------------------------------------------------------- | ----------------------------------------------- |
| NOTIF-VAL-001 | `templateBody` | Required, max configured length, only approved variables.   | `notifications.validation.template_invalid`     |
| NOTIF-VAL-002 | `channel`      | Must be enabled for business/branch and notification type.  | `notifications.validation.channel_unavailable`  |
| NOTIF-VAL-003 | `recipient`    | Must have valid channel address and consent where required. | `notifications.validation.recipient_invalid`    |
| NOTIF-VAL-004 | `quietHours`   | Start/end must be valid local times.                        | `notifications.validation.quiet_hours_invalid`  |
| NOTIF-VAL-005 | `retryPolicy`  | Must not exceed platform retry cap.                         | `notifications.validation.retry_policy_invalid` |
