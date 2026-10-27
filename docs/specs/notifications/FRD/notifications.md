# Notifications Functional Requirements

**Date:** 2026-05-18
**Status:** Current planning baseline

## Functional Requirements

| ID           | Requirement                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------------- |
| NOTIF-FR-001 | Notification types must distinguish transactional, security, reminder, marketing, staff, and system/admin alerts.   |
| NOTIF-FR-002 | Transactional notifications must not be blocked by marketing opt-out.                                               |
| NOTIF-FR-003 | Marketing notifications must respect customer consent and channel preferences.                                      |
| NOTIF-FR-004 | Templates must use approved variables and localization keys.                                                        |
| NOTIF-FR-005 | Delivery attempts must store channel, provider, status, retry count, provider response summary, and correlation ID. |
| NOTIF-FR-006 | Duplicate reminders for the same event/window must be prevented.                                                    |
| NOTIF-FR-007 | Provider failure must not roll back the source business transaction.                                                |
| NOTIF-FR-008 | Branch-level notification settings may override business defaults where the feature allows it.                      |

## Business Rules

| Rule ID      | Rule                                                                                          |
| ------------ | --------------------------------------------------------------------------------------------- |
| NOTIF-BR-001 | OTP/security content must not include secrets in logs or audit metadata.                      |
| NOTIF-BR-002 | Template variable rendering must escape unsafe content.                                       |
| NOTIF-BR-003 | Marketing unsubscribe must be honored before queueing provider delivery.                      |
| NOTIF-BR-004 | Retry policies must avoid duplicate high-impact messages.                                     |
| NOTIF-BR-005 | Delivery logs must be visible only to authorized users in the correct business/support scope. |
