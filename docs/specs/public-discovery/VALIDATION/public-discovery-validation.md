# Public Discovery Validation And Controls

**Date:** 2026-05-18
**Status:** Current planning baseline

## Query Controls

| Control ID                     | Fields                                                                                   |
| ------------------------------ | ---------------------------------------------------------------------------------------- |
| `public.search.form`           | `q`, `city`, `area`, `serviceId`, `ratingMin`, `priceRange`, `availabilityDate`, `limit` |
| `public.profile.booking-entry` | `serviceId`, `branchId`, `preferredDate`                                                 |

## Rules

| Rule ID      | Field              | Rule                                                                             | Error key                                               |
| ------------ | ------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------- |
| DISC-VAL-001 | `q`                | Trimmed, 2 to 120 characters when present.                                       | `public_discovery.validation.query_invalid`             |
| DISC-VAL-002 | `city` / `area`    | Optional city or area filter; must map to public searchable location data.       | `public_discovery.validation.location_invalid`          |
| DISC-VAL-003 | `serviceId`        | Optional public-safe service identifier; must refer to a public-visible service. | `public_discovery.validation.service_invalid`           |
| DISC-VAL-004 | `ratingMin`        | Optional number 1 through 5.                                                     | `public_discovery.validation.rating_invalid`            |
| DISC-VAL-005 | `priceRange`       | Must match supported range enum when exposed by the API contract.                | `public_discovery.validation.price_range_invalid`       |
| DISC-VAL-006 | `availabilityDate` | Must be valid date and not before today when exposed by the API contract.        | `public_discovery.validation.availability_date_invalid` |
| DISC-VAL-007 | `limit`            | Follows the project-wide OpenAPI `LimitQuery` constraint and default.            | `public_discovery.validation.limit_invalid`             |

## Backend Enforcement

Backend must ignore or reject unknown filters. Unknown filters should return `422` when the API contract exposes explicit filter names.
