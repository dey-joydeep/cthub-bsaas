# Salon Search API Requirements

## Functional Requirements

- The system must allow searching salons by any field, including:
  - Name
  - City
  - Address
  - Zip code
  - Services (array, partial match)
- The search query must be applied immediately in a single database query (no post-processing for field search).
- The endpoint must support pagination:
  - Default page size is 10
  - User can set page size to 15, 20, 25, or 30 (maximum allowed is 30)
  - Any other value defaults to 10
- The following additional filters must be supported:
  - `service`: Filter salons that offer a specific service (case-insensitive, partial match)
  - `min_rating`: Filter salons with average rating greater than or equal to this value
  - `max_rating`: Filter salons with average rating less than or equal to this value
- Results must be sorted by:
  1. Average rating (descending)
  2. Name (ascending, A-Z)

## API Parameters (`SearchSalonsParams`)

| Parameter  | Type               | Description                                                        |
| ---------- | ------------------ | ------------------------------------------------------------------ |
| query      | string             | Search term for any field (name, city, address, zip, services)     |
| skip       | number             | Number of records to skip (pagination)                             |
| take       | 10\|15\|20\|25\|30 | Page size: allowed values are 10 (default), 15, 20, 25, 30; max 30 |
| service    | string             | Filter by a specific service keyword (partial/case-insensitive)    |
| min_rating | number             | Filter: average rating >= min_rating                               |
| max_rating | number             | Filter: average rating <= max_rating                               |

## Notes

- Service and rating filters are applied after the initial field search.
- Average rating is calculated per salon and used for filtering and sorting.
- All logic must use PostgreSQL and/or MongoDB for production (no in-memory/demo data).
- Interface definitions must reside in the `models` folder, with one interface per file.
