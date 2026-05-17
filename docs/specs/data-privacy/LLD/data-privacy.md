# Data Privacy And Governance LLD

**Date:** 2026-05-18
**Status:** Current planning baseline

## Commands And Queries

| Operation | Type | Notes |
| --- | --- | --- |
| `createPrivacyRequest` | Command | Export/delete/anonymize entry point. |
| `reviewPrivacyRequest` | Command | Platform/support review with reason. |
| `executePrivacyRequest` | Command | Runs export/anonymization according to policy. |
| `getPrivacyRequestStatus` | Query | Owner-visible status. |
| `createDataExport` | Command | Scoped async export. |
| `mergeCustomerProfiles` | Command | Strongly audited merge within business scope. |
| `accessRestrictedNote` | Command/Query | Captures reason before returning sensitive note. |

## State Machine

| State | Meaning |
| --- | --- |
| `requested` | User or admin created request. |
| `under_review` | Awaiting policy/support review. |
| `approved` | Ready for execution. |
| `rejected` | Not allowed under policy. |
| `processing` | Export/delete/anonymize running. |
| `completed` | Completed with evidence. |
| `failed` | Failed with retry or support action required. |

## Test Implications

Tests must cover retention blocks, anonymization, export scope, merge audit, restricted note access, and support reason capture.
