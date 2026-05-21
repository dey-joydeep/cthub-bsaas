# Reputation And Reviews Functional Requirements

**Date:** 2026-05-18
**Status:** Current planning baseline

## Functional Requirements

| ID         | Requirement                                                                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| REP-FR-001 | Customer may submit one review for one eligible completed appointment.                                                                                  |
| REP-FR-002 | Review may include rating, text, approved photos, and category ratings where configured.                                                                |
| REP-FR-003 | Owner may respond to reviews according to policy.                                                                                                       |
| REP-FR-004 | Review moderation states must include pending, approved, rejected, hidden, and flagged.                                                                 |
| REP-FR-005 | Public profile must show only reviews allowed by moderation visibility rules.                                                                           |
| REP-FR-006 | Reputation insights must show rating trends, response time, and feedback themes when available.                                                         |
| REP-FR-007 | Review request notifications must use notification consent and duplicate prevention rules.                                                              |
| REP-FR-008 | Public review lists must support newest-first ordering and expose aggregate rating and review count from persisted review data or approved read models. |

## Business Rules

| Rule ID    | Rule                                                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| REP-BR-001 | Cancelled and no-show appointments are not review-eligible.                                                               |
| REP-BR-002 | Duplicate review for the same appointment is blocked.                                                                     |
| REP-BR-003 | Anonymous public display must retain internal customer linkage.                                                           |
| REP-BR-004 | Review incentives must not require positive sentiment.                                                                    |
| REP-BR-005 | Moderation and owner responses must be audited.                                                                           |
| REP-BR-006 | Review content must be sanitized for public display.                                                                      |
| REP-BR-007 | Demo or in-memory review data must not be used for production review aggregation, public display, or reputation insights. |
