# Project-Wide Implementation Specs

**Date:** 2026-05-19
**Status:** Production planning baseline

## Purpose

This folder closes the project-wide documentation gap between feature specifications and implementation work. It is used after the stacked documentation PRs are merged and before feature coding starts.

## Documents

| Document | Purpose |
| --- | --- |
| [Project-Wide OpenAPI Contract](API/openapi.yaml) | Target HTTP contract for project-wide feature areas that are not covered by Auth or Salon Owner MVP OpenAPI files. |
| [Project-Wide API Schema Catalog](API/schema-catalog.md) | Operation-level DTO fields and response payload expectations used with the OpenAPI contract. |
| [Implementation Slicing Plan](IMPLEMENTATION/implementation-slicing.md) | Coding-ready backend/frontend work slices, sequencing, validation gates, and branch strategy. |

## Source-Of-Truth Rule

Implementation must use the most specific contract available:

1. Auth endpoints: `docs/specs/auth/API/openapi.yaml`.
2. Salon Owner MVP endpoints: `docs/specs/salon-owner/API/openapi.yaml`.
3. Project-wide supporting areas: `docs/specs/project-wide/API/openapi.yaml`.
4. Feature endpoint maps remain traceability indexes, not substitutes for OpenAPI.
