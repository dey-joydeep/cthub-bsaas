# Data Privacy And Governance Validation And Controls

**Date:** 2026-05-18
**Status:** Current planning baseline

| Rule ID | Field | Rule | Error key |
| --- | --- | --- | --- |
| DATA-VAL-001 | `requestType` | Must be `export`, `delete`, or `anonymize` according to actor. | `privacy.validation.request_type_invalid` |
| DATA-VAL-002 | `reason` | Required for support/admin review and restricted access. | `privacy.validation.reason_required` |
| DATA-VAL-003 | `dateRange` | Required for exports and must be within allowed range. | `privacy.validation.date_range_invalid` |
| DATA-VAL-004 | `sourceCustomerId/targetCustomerId` | Must belong to same salon business for merge. | `privacy.validation.merge_scope_invalid` |
| DATA-VAL-005 | `confirmation` | Required for delete/anonymize/merge actions. | `privacy.validation.confirmation_required` |
