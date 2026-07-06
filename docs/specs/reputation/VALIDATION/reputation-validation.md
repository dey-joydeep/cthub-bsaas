# Reputation And Reviews Validation And Controls

**Date:** 2026-05-18
**Status:** Current planning baseline

| Rule ID     | Field              | Rule                                                             | Error key                                          |
| ----------- | ------------------ | ---------------------------------------------------------------- | -------------------------------------------------- |
| REP-VAL-001 | `appointmentId`    | Must belong to customer and be completed/eligible.               | `reputation.validation.appointment_not_eligible`   |
| REP-VAL-002 | `rating`           | Integer 1 through 5.                                             | `reputation.validation.rating_invalid`             |
| REP-VAL-003 | `text`             | Optional, max 2000 characters, sanitized.                        | `reputation.validation.text_invalid`               |
| REP-VAL-004 | `photos`           | Must be supported media type and approved before public display. | `reputation.validation.photo_invalid`              |
| REP-VAL-005 | `responseText`     | Owner response max 2000 characters, sanitized.                   | `reputation.validation.response_invalid`           |
| REP-VAL-006 | `moderationReason` | Required for reject, hide, or flag action.                       | `reputation.validation.moderation_reason_required` |
