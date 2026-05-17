# Production Documentation Standard

**Date:** 2026-05-12
**Status:** Active standard

## Purpose

Define how agents and developers must create production-ready product and technical documents in this repository. The goal is to prevent vague overview documents that cannot be implemented from.

Use the Salon Owner documentation pack as the reference implementation:

- [Salon Owner Spec Index](../specs/salon-owner/README.md)
- [Business Operating Model](../specs/salon-owner/FRD/business-operating-model.md)
- [Business Rules](../specs/salon-owner/FRD/business-rules.md)
- [Permissions Matrix](../specs/salon-owner/FRD/permissions-matrix.md)
- [Non-Functional Requirements](../specs/salon-owner/FNRD/non-functional-requirements.md)
- [Feature HLD Index](../specs/salon-owner/HLD/README.md)
- [Feature LLD Index](../specs/salon-owner/LLD/README.md)
- [Web HLD](../specs/salon-owner/HLD/web-hld.md)
- [Web LLD](../specs/salon-owner/WEB/web-lld.md)
- [Validation Index](../specs/salon-owner/VALIDATION/README.md)
- [API Endpoint Map](../specs/salon-owner/API/endpoint-map.md)
- [Feature Test Index](../specs/salon-owner/TEST/README.md)
- [OpenAPI Contract](../specs/salon-owner/API/openapi.yaml)

For visual collaboration, wireframes, prototypes, and architecture diagrams, also follow [Visual Collaboration Guideline](./visual-collaboration-guideline.md).

## Required Mindset

Documentation is part of delivery. A production-ready document must let a developer, tester, reviewer, and future agent understand what to build, how it behaves, how it is constrained, and how it will be verified.

A document is incomplete when it only says what screens or modules exist. It must also define:

- actors and operating context;
- data ownership and scope;
- business rules;
- permissions;
- validation and control behavior;
- state transitions;
- API contracts;
- error handling;
- test expectations;
- non-functional constraints.

## Required Agent Roleplay

When creating or reviewing requirements/design docs, the agent must intentionally switch roles. Each role catches a different class of gaps.

| Role               | Question to answer                                                                     | Required output                                                                    |
| ------------------ | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Business Owner     | How would I run this business every day?                                               | Operating model, workflows, edge cases, reports, responsibilities.                 |
| Platform Owner     | How can this support many businesses without custom rewrites?                          | Tenant/business/branch scope, configuration inheritance, extensibility boundaries. |
| End Customer       | What will the customer experience, consent to, pay for, or complain about?             | Customer-visible flows, privacy, communication, receipts, service history.         |
| Staff User         | What does the receptionist, stylist, cashier, manager, or accountant need during work? | Screen actions, permissions, shortcuts, error states, audit needs.                 |
| Business Analyst   | What are the binding requirements behind the user stories?                             | FRD, rule IDs, acceptance criteria, state machines, permission matrix.             |
| Solution Architect | What system boundaries and data ownership preserve maintainability?                    | HLD, bounded contexts, dependency rules, data model, integration points.           |
| Lead Engineer      | What must be specified so developers do not guess?                                     | LLD, service contracts, DTOs, transactions, validation, errors, tests.             |
| Developer          | Can I implement this without asking basic behavior questions?                          | Concrete page/service/API/form contracts.                                          |
| QA Engineer        | Can I derive deterministic tests from this?                                            | Test strategy, coverage map, positive/negative/concurrency/security cases.         |

The document set must reflect all roles. If one role cannot answer its question from the docs, the docs are not production-ready.

## Documentation Chain

Use this chain for new feature areas:

```text
User Stories
  -> Cross-Cutting FRD / Feature FRDs
  -> FNRD / Non-Functional Requirements
  -> Cross-Cutting HLD / Feature HLDs
  -> Cross-Cutting LLD / Feature LLDs
  -> API Contract
  -> Validation Index And Feature Validation Specs
  -> Cross-Cutting Web LLD / Feature Web LLDs
  -> Cross-Cutting Test Strategy / Feature Test Specs
```

Do not jump from user stories directly to code-level LLD. The FRD/FNRD layer is the refined business source.

## Folder Structure

For a feature named `<feature>`, use:

```text
docs/us/<feature>/
  README.md
  release-scope.md
  screen-map.md
  <subfeature>/<subfeature>-user-stories.md

docs/specs/<feature>/
  README.md
  FRD/
    README.md
    business-operating-model.md
    business-rules.md
    permissions-matrix.md
    <subfeature>.md
  FNRD/
    non-functional-requirements.md
  HLD/
    README.md
    overview.md
    domain-architecture.md
    data-model.md
    api-hld.md
    web-hld.md
    <subfeature>.md
  LLD/
    README.md
    mvp-lld.md
    service-contracts.md
    <subfeature>.md
  API/
    endpoint-map.md
    openapi.yaml
  WIREFRAMES/
    README.md
    <screen-or-flow>.md
  VALIDATION/
    README.md
    shared-validation-and-control.md
    <subfeature-or-screen>-validation.md
  WEB/
    README.md
    web-lld.md
    <subfeature-or-screen>.md
  DIAGRAMS/
    README.md
    <diagram-name>.drawio.svg
  TEST/
    README.md
    test-strategy.md
    <subfeature>.md
```

Use cross-cutting files for behavior shared by the whole domain. Use feature or screen files for details owned by a specific implementation slice. Do not leave a large generic document as the only source for a screen or feature that has independent business rules, API operations, validation, or tests.

## User Story Standard

User stories must capture business intent, not just UI actions.

Each feature story file must include:

- owner outcome;
- actors;
- primary screens/workflows;
- user stories with stable IDs;
- functional requirements;
- business rules and edge cases;
- acceptance criteria;
- non-functional requirements;
- downstream HLD/LLD hints.

For multi-business SaaS features, user stories must clarify whether the behavior is tenant-scoped, business-scoped, branch-scoped, customer-scoped, or user-scoped.

## FRD Standard

FRD documents are authoritative business requirements.

They must include:

- operating model;
- entity ownership;
- configuration inheritance;
- scope rules;
- business rule IDs;
- state machines;
- permission matrix;
- explicit error outcomes where relevant.

FRD organization:

- `business-operating-model.md`, `business-rules.md`, and `permissions-matrix.md` hold shared domain rules.
- Feature files such as `appointment.md`, `pos.md`, or `inventory.md` hold feature-owned workflows, actors, rules, edge cases, and downstream implementation references.
- Feature FRDs link to HLD, LLD, Web, Validation, Test, and API mapping docs for that same feature.

FRD language must be binding:

- use `must`, `must not`, `is allowed only when`, `returns 409`, `returns 403`;
- avoid vague or advisory wording in business rules;
- every exception must be explicitly documented.

Example reference: [Salon Owner Business Rules](../specs/salon-owner/FRD/business-rules.md).

## FNRD Standard

FNRD documents must define production constraints that affect design and tests:

- security;
- data integrity;
- performance;
- reliability;
- observability;
- accessibility;
- SSR/browser safety where relevant;
- privacy and data retention where relevant.

Each non-functional requirement must be specific enough to test or review.

Example reference: [Salon Owner Non-Functional Requirements](../specs/salon-owner/FNRD/non-functional-requirements.md).

## HLD Standard

HLD documents define architecture and system boundaries. They must not be a loose feature overview.

HLD must include:

- requirement source links;
- scope and out-of-scope boundaries;
- bounded contexts/modules;
- dependency direction;
- data ownership;
- cross-cutting requirements;
- high-level events/integration points;
- risks and mitigations.

HLD organization:

- Cross-cutting HLD files define bounded contexts, dependencies, data model, API resource model, and web shell architecture.
- Feature HLD files define the aggregate ownership, dependencies, events, security, consistency, and integration points for one feature.
- A feature HLD links to the corresponding FRD, LLD, Web LLD, Validation spec, and API endpoint map.

HLD can contain architectural preferences, but business behavior must come from FRD.

Example references:

- [Salon Owner HLD Index](../specs/salon-owner/HLD/README.md)
- [Salon Owner HLD Overview](../specs/salon-owner/HLD/overview.md)
- [Salon Owner Domain Architecture](../specs/salon-owner/HLD/domain-architecture.md)
- [Salon Owner Web HLD](../specs/salon-owner/HLD/web-hld.md)

## LLD Standard

LLD documents translate FRD/HLD into implementation design.

LLD must include:

- module sequence;
- commands and query DTOs;
- service methods;
- repository/port contracts;
- transaction boundaries;
- state transition implementation rules;
- validation ownership;
- error handling;
- event payload shape;
- test implications.

LLD organization:

- Cross-cutting LLD files define module sequencing, shared service contracts, shared ports, and read model strategy.
- Feature LLD files define the commands, queries, service methods, repository ports, transactions, validation mappings, error mappings, and implementation notes for one feature.
- A feature LLD must map every write command to its feature validation spec and every API operation to OpenAPI through the endpoint map.

LLD must not contain unresolved business decisions. If a business rule is missing, update FRD first.

Example references:

- [Salon Owner LLD Index](../specs/salon-owner/LLD/README.md)
- [Salon Owner MVP LLD](../specs/salon-owner/LLD/mvp-lld.md)
- [Salon Owner Service Contracts](../specs/salon-owner/LLD/service-contracts.md)

## API Contract Standard

OpenAPI is the source of truth for external HTTP contracts.

OpenAPI must include:

- paths and methods;
- operation IDs;
- request parameters;
- request bodies;
- response envelopes;
- error envelope;
- auth/security expectations;
- reusable schemas;
- field type, required, enum, min/max, format, and pattern constraints.

The API folder must also include an endpoint map when the domain has multiple features. The endpoint map links each feature to operation IDs and paths so developers can trace FRD/HLD/LLD/Web/Test references back to the OpenAPI contract without duplicating schemas.

Do not leave endpoint lists as "draft" when the goal is implementation planning. If code will be built from it, provide the target OpenAPI contract.

Example references:

- [Salon Owner Endpoint Map](../specs/salon-owner/API/endpoint-map.md)
- [Salon Owner OpenAPI Contract](../specs/salon-owner/API/openapi.yaml)

## Validation And Control Standard

Every production spec must document shared validation when forms or write commands are involved.

Validation belongs under `VALIDATION/`, not under `WEB/`, because backend enforcement is authoritative and frontend validation is only a UX mirror.

The validation folder must include:

- `README.md` as the validation index;
- `shared-validation-and-control.md` for common ownership, control, error, and timing rules;
- feature/screen-specific validation files such as `appointment-validation.md`, `pos-validation.md`, or `staff-validation.md`.

The shared validation document must include:

- backend validation ownership;
- frontend mirror validation expectations;
- OpenAPI transport schema relationship;
- common control types for UI implementation;
- validation timing;
- common server error mapping;
- common disablement rules.

Each feature/screen validation document must include:

- screen ID;
- form ID;
- actors;
- required tenant/business/branch context;
- create vs edit differences;
- submit operation;
- idempotency requirement;
- per-form and per-command field list;
- required/optional status;
- default values;
- enabled/disabled rules by role and state;
- dependent field behavior;
- client validation and trigger timing;
- backend DTO/service validation;
- cross-field validation;
- exact error message keys;
- permission-based disablement/hiding;
- conflict behavior per submit action;
- readonly/immutable field behavior;
- backend and frontend validation test mapping.

Example references:

- [Salon Owner Validation Index](../specs/salon-owner/VALIDATION/README.md)
- [Salon Owner Shared Validation And Control](../specs/salon-owner/VALIDATION/shared-validation-and-control.md)
- [Salon Owner Appointment Validation](../specs/salon-owner/VALIDATION/appointment-validation.md)

## Web Documentation Standard

Web HLD/LLD must define how screens actually work.

Web docs must include:

- route groups;
- shell/context model;
- business/branch selectors where relevant;
- route guards;
- page components;
- page state;
- API service mapping;
- permission behavior;
- links to the shared validation/control spec;
- loading, empty, forbidden, validation, conflict, and server error states;
- accessibility;
- SSR safety;
- test requirements.

Web organization:

- `web-lld.md` defines shared shell, routing, state, layout, API-service, SSR, accessibility, and error-state patterns.
- Feature or screen Web LLD files define route, primary screens, components, state, API operations, validation references, error handling, and accessibility for one screen group.
- Each feature Web LLD links to its feature validation spec and aligns with the endpoint map.

Do not stop at a screen inventory. Screen inventory belongs in user-story planning; Web LLD must be implementable.

Use Penpot wireframes when screen layout, component placement, responsive behavior, or clickable flow is implementation-relevant. Store links and exported review assets under the feature `WIREFRAMES/` folder according to [Visual Collaboration Guideline](./visual-collaboration-guideline.md).

Example references:

- [Salon Owner Web HLD](../specs/salon-owner/HLD/web-hld.md)
- [Salon Owner Web Index](../specs/salon-owner/WEB/README.md)
- [Salon Owner Web LLD](../specs/salon-owner/WEB/web-lld.md)

## Test Strategy Standard

Test strategy must be traceable to FRD/FNRD/HLD/LLD/API/Web docs.

It must include:

- unit test focus;
- integration test scenarios;
- API contract tests;
- web unit/component tests;
- e2e smoke candidates;
- concurrency tests;
- security/permission tests;
- coverage expectations.

Test organization:

- `test-strategy.md` defines shared coverage, test levels, fixtures, e2e smoke candidates, security, and NFR expectations.
- Feature test files define backend unit, backend integration, web, and contract tests for one feature.
- Feature test files must cover permission boundaries, validation failures, conflicts, and the highest-risk business rules from that feature FRD.

Business rules with rule IDs must have test coverage or an explicit reason for delayed coverage.

Example references:

- [Salon Owner Test Index](../specs/salon-owner/TEST/README.md)
- [Salon Owner Test Strategy](../specs/salon-owner/TEST/test-strategy.md)

## Traceability Rules

Each downstream document must link back to its source:

- FRD links to user stories.
- HLD links to FRD/FNRD.
- LLD links to FRD/FNRD/HLD and validation index.
- API endpoint map links features to OpenAPI operation IDs.
- API contract aligns with LLD and OpenAPI lint.
- Validation index links to shared and feature-specific validation specs.
- Feature-specific validation specs link to or align with OpenAPI, FRD, LLD, Web LLD, and permissions.
- Web LLD links to Web HLD, endpoint map, FRD, and validation index.
- Test strategy and feature test specs link to business rules and implementation contracts where useful.

Avoid duplicating large sections across documents. Link to the source and refine only the details owned by the current document.

## Language Rules

Production documents must use concrete, enforceable language.

Acceptable:

- `must`
- `must not`
- `requires`
- `returns 409`
- `is allowed only when`
- `server remains authoritative`

Not acceptable for binding behavior:

- vague future wording;
- unresolved options;
- advisory words where a rule is required;
- "implementation can decide" without a named decision owner.

Architecture docs can describe options only when the decision is explicitly out of current scope and not needed for implementation.

## Readiness Checklist

A feature documentation pack is production-ready only when all answers are yes:

| Check          | Question                                                                 |
| -------------- | ------------------------------------------------------------------------ |
| Business model | Are tenant/business/branch/customer/user ownership rules clear?          |
| Scope          | Are MVP, V1, and later capabilities separated?                           |
| Rules          | Are business rules binding and testable?                                 |
| Permissions    | Are actor roles and operation permissions explicit?                      |
| Data           | Are entities, relationships, snapshots, and state transitions clear?     |
| API            | Is OpenAPI present and linted for implementation-scope HTTP contracts?   |
| Web            | Are routes, guards, state, API mapping, and screen behavior defined?     |
| Inputs         | Are controls, validation, disablement, and server error mapping defined? |
| Tests          | Can QA derive test cases without guessing?                               |
| Language       | Are vague/advisory phrases removed from binding requirements?            |
| Links          | Do local Markdown links resolve?                                         |
| Formatting     | Does `git diff --check` pass?                                            |

## Validation Commands

Run the relevant validation before considering docs complete:

```powershell
npx prettier --write "docs/specs/<feature>/**/*.md" "docs/specs/<feature>/**/*.yaml"
npx redocly lint docs/specs/<feature>/API/openapi.yaml --config .redocly.yaml --max-problems=0
git diff --check
```

Also run a local Markdown link check for the feature folder. If no link checker exists, use a scoped script or PowerShell check similar to the one used during Salon Owner documentation work.
