# Public Discovery API Endpoint Map

**Date:** 2026-05-18
**Status:** Traceability index for project-wide OpenAPI

| Capability | Method | Path | Operation ID |
| --- | --- | --- | --- |
| Public home data | `GET` | `/public/home` | `getPublicHome` |
| Search salons | `GET` | `/public/salons` | `searchPublicSalons` |
| Get public salon profile | `GET` | `/public/salons/{slug}` | `getPublicSalonProfile` |
| List public salon services | `GET` | `/public/salons/{slug}/services` | `listPublicSalonServices` |
| List public reviews | `GET` | `/public/salons/{slug}/reviews` | `listPublicSalonReviews` |
| List public portfolio | `GET` | `/public/salons/{slug}/portfolio` | `listPublicSalonPortfolio` |
| Get availability signal | `GET` | `/public/salons/{slug}/availability` | `getPublicAvailabilitySignal` |

## OpenAPI Rule

These operations are represented in [Project-Wide Supporting OpenAPI](../../project-wide/API/openapi.yaml). This endpoint map remains the feature traceability index.
