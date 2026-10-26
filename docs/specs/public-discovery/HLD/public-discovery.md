# Public Discovery HLD

**Date:** 2026-05-18
**Status:** Current planning baseline

## Boundary

Public Discovery owns anonymous and public customer discovery. It must not own booking confirmation, private customer profile data, or salon operational administration.

## Architecture Concerns

| Concern             | Requirement                                                                                         |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| SSR                 | Public pages must render useful content server-side.                                                |
| SEO                 | Slugs, metadata, canonical URLs, and structured content must be stable.                             |
| Public data shaping | Public DTOs must exclude internal IDs, private notes, unpublished prices, and staff private data.   |
| Cache               | Public listings may be cached with invalidation on salon/service/review visibility changes.         |
| Search              | Query model must support location, service, salon name, category, rating, and availability signals. |

## Integration Points

- Salon business and branch visibility.
- Service catalog public visibility.
- Reputation moderated reviews.
- Portfolio public media.
- Customer booking entry.

## Diagram

See [public-discovery-search-flow.drawio](../DIAGRAMS/public-discovery-search-flow.drawio).
