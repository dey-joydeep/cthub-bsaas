# Data Privacy Non-Functional Requirements

**Date:** 2026-05-18
**Status:** Current planning baseline

| ID           | Requirement                                                                        |
| ------------ | ---------------------------------------------------------------------------------- |
| DATA-NFR-001 | PII access must be auditable.                                                      |
| DATA-NFR-002 | Large exports must run asynchronously.                                             |
| DATA-NFR-003 | Privacy request processing must be idempotent and recoverable.                     |
| DATA-NFR-004 | Logs and audit metadata must not contain secrets or unnecessary sensitive content. |
| DATA-NFR-005 | Export files must have time-limited access and must not be publicly guessable.     |
| DATA-NFR-006 | Deletion/anonymization jobs must produce completion evidence.                      |
