# Data Privacy And Governance Web Specification

**Date:** 2026-05-18
**Status:** Current planning baseline

## Routes

| Route                              | Screen ID                 |
| ---------------------------------- | ------------------------- |
| `/account/privacy`                 | `privacy.myRequests`      |
| `/partner/data-exports`            | `privacy.businessExports` |
| `/partner/customers/merge`         | `privacy.customerMerge`   |
| `/admin/platform/privacy-requests` | `privacy.platformQueue`   |

## Screen Requirements

- Privacy request screen must show request type, status, created date, and outcome.
- Data export screen must show filters, scope, async status, expiry, and audit note.
- Customer merge screen must show source/target preview and irreversible impact confirmation.
- Platform queue must show review reason, legal hold indicators, and execution status.
