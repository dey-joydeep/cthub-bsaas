# Public Discovery API Endpoint Map

**Date:** 2026-05-18
**Status:** Target planning contract

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

Before implementation, these operations must be represented in a public discovery OpenAPI contract or reconciled into owning feature contracts.
