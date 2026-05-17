# Salon Owner MVP HLD/LLD Spec Index

**Date:** 2026-05-11
**Status:** Implementation baseline
**Scope:** Salon Owner MVP operational core.

## Purpose

This spec pack converts the Salon Owner user stories into implementation-ready functional requirements, HLD, LLD, API, web, and test guidance. It is intended for backend, frontend, QA, and architecture work.

## Source User Stories

- [Salon Owner User Stories](../../us/salon-owner/README.md)
- [Salon Owner Release Scope](../../us/salon-owner/release-scope.md)
- [Salon Owner Screen Map](../../us/salon-owner/screen-map.md)
- [Project User Story Backlog Map](../../us/project-backlog-map.md)
- [Cross-Cutting NFRs](../../us/cross-cutting/non-functional-user-stories.md)
- [Data Privacy And Governance](../../us/data-privacy/README.md)

## Documents

| Area       | Document                                                           | Purpose                                                            |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| FRD        | [FRD Index](FRD/README.md)                                         | Authoritative functional requirements and rule index.              |
| FRD        | [Business Operating Model](FRD/business-operating-model.md)        | Tenant, salon business, legal registration, branch model.          |
| FRD        | [Business Rules](FRD/business-rules.md)                            | Binding cross-feature business behavior.                           |
| FRD        | [Permissions Matrix](FRD/permissions-matrix.md)                    | Role, scope, and operation permission rules.                       |
| FNRD       | [Non-Functional Requirements](FNRD/non-functional-requirements.md) | Security, data integrity, reliability, observability.              |
| HLD        | [HLD Index](HLD/README.md)                                         | Cross-cutting and feature-specific architecture documents.         |
| HLD        | [Overview](HLD/overview.md)                                        | System context, MVP scope, architecture decisions.                 |
| HLD        | [Domain Architecture](HLD/domain-architecture.md)                  | Bounded contexts, module boundaries, dependencies.                 |
| HLD        | [Data Model](HLD/data-model.md)                                    | Entity model, relationships, lifecycle states.                     |
| HLD        | [API HLD](HLD/api-hld.md)                                          | API resource model and endpoint groups.                            |
| HLD        | [Web HLD](HLD/web-hld.md)                                          | Screen architecture and state/data boundaries.                     |
| LLD        | [LLD Index](LLD/README.md)                                         | Cross-cutting and feature-specific implementation documents.       |
| LLD        | [MVP LLD](LLD/mvp-lld.md)                                          | Detailed implementation design for MVP modules.                    |
| LLD        | [Service Contracts](LLD/service-contracts.md)                      | Ports, services, commands, read models.                            |
| API        | [OpenAPI Contract](API/openapi.yaml)                               | Target REST contract for implementation.                           |
| API        | [Endpoint Map](API/endpoint-map.md)                                | Feature-to-operation mapping for the OpenAPI contract.             |
| WIREFRAMES | [Wireframe Index](WIREFRAMES/README.md)                            | Penpot wireframe references and screen transition support.         |
| WEB        | [Web Index](WEB/README.md)                                         | Cross-cutting and screen-specific web specifications.              |
| WEB        | [Web LLD](WEB/web-lld.md)                                          | Partner web routes, components, API services, UI rules.            |
| VALIDATION | [Validation Index](VALIDATION/README.md)                           | Shared and feature-specific backend/frontend validation contracts. |
| TEST       | [Test Index](TEST/README.md)                                       | Cross-cutting and feature-specific verification documents.         |
| TEST       | [Test Strategy](TEST/test-strategy.md)                             | Unit, integration, e2e, contract, and NFR tests.                   |

## Implementation Rule

Developers must not implement directly from user stories alone. Use the FRD/FNRD documents as the refined business source, then use HLD/LLD/API/Web/Test docs for implementation detail. When this spec conflicts with source user stories, resolve the conflict in the user story or FRD first, then update downstream design and contract documents.
