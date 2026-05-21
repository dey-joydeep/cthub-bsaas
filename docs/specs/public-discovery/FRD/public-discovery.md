# Public Discovery Functional Requirements

**Date:** 2026-05-18
**Status:** Current planning baseline

## Owner Outcome

Prospective customers must be able to find active salons, compare services, inspect public salon profiles, and start booking without seeing private or unpublished business data.

## Functional Requirements

| ID          | Requirement                                                                                                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| DISC-FR-001 | Public home must provide service, salon, and location search entry points.                                                                                                                 |
| DISC-FR-002 | Search results must include active, public-visible salons and branches only and support `q`, `city`, `area`, `serviceId`, `ratingMin`, cursor/limit pagination, and deterministic sorting. |
| DISC-FR-003 | Salon cards must show name, rating, review count, area, services, offer signal, and booking CTA.                                                                                           |
| DISC-FR-004 | Public salon profile must show public services, branch hours, address/map, policies, photos, reviews, and staff highlights where enabled.                                                  |
| DISC-FR-005 | Public prices must match branch/service configuration or use a clear "starts from" presentation.                                                                                           |
| DISC-FR-006 | Portfolio media must appear only when approved for public display and consent rules are satisfied.                                                                                         |
| DISC-FR-007 | Public pages must support SSR and SEO metadata.                                                                                                                                            |

## Business Rules

| Rule ID     | Rule                                                                                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DISC-BR-001 | Inactive, suspended, draft, or private salons must not appear publicly.                                                                                             |
| DISC-BR-002 | Services hidden from online booking must not be bookable from public profile.                                                                                       |
| DISC-BR-003 | Review content must pass moderation rules before public display.                                                                                                    |
| DISC-BR-004 | Public APIs must expose public-safe IDs, slugs, and fields only.                                                                                                    |
| DISC-BR-005 | Availability signals are advisory until booking confirmation re-checks availability.                                                                                |
| DISC-BR-006 | Public salon search must filter in the database/read model, not by post-processing private records after retrieval.                                                 |
| DISC-BR-007 | Public salon search sorting must be deterministic; rating-descending and name-ascending are the default tie-breakers unless a later ranking policy supersedes them. |

## Error Outcomes

| Case                          | Required outcome                                         |
| ----------------------------- | -------------------------------------------------------- |
| Unknown or private salon slug | `404` public not found.                                  |
| Unsupported filter value      | `422` with `public_discovery.validation.filter_invalid`. |
| Search rate limit exceeded    | `429` with `Retry-After`.                                |
