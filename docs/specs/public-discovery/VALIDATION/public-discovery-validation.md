# Public Discovery Validation And Controls

**Date:** 2026-05-18
**Status:** Current planning baseline

## Query Controls

| Control ID | Fields |
| --- | --- |
| `public.search.form` | `query`, `location`, `service`, `rating`, `priceRange`, `availabilityDate` |
| `public.profile.booking-entry` | `serviceId`, `branchId`, `preferredDate` |

## Rules

| Rule ID | Field | Rule | Error key |
| --- | --- | --- | --- |
| DISC-VAL-001 | `query` | Trimmed, 2 to 120 characters when present. | `public_discovery.validation.query_invalid` |
| DISC-VAL-002 | `location` | City, area, or geolocation token must be recognized. | `public_discovery.validation.location_invalid` |
| DISC-VAL-003 | `rating` | Number 1 through 5. | `public_discovery.validation.rating_invalid` |
| DISC-VAL-004 | `priceRange` | Must match supported range enum. | `public_discovery.validation.price_range_invalid` |
| DISC-VAL-005 | `availabilityDate` | Must be valid date and not before today. | `public_discovery.validation.availability_date_invalid` |

## Backend Enforcement

Backend must ignore or reject unknown filters. Unknown filters should return `422` when the API contract exposes explicit filter names.
