# Public Discovery LLD

**Date:** 2026-05-18
**Status:** Current planning baseline

## Suggested Modules

| Module                              | Responsibility                                  |
| ----------------------------------- | ----------------------------------------------- |
| `server-feature-public-discovery`   | Public search/profile read models.              |
| `server-contracts-public-discovery` | Public discovery DTOs and query ports.          |
| `web-customer-public-discovery`     | Public home, search results, and profile pages. |

## Queries

| Query                              | Notes                                                                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `searchPublicSalons(query)`        | `q`, `city`, `area`, `serviceId`, `ratingMin`, cursor/limit pagination, deterministic sorting, and availability signals. |
| `getPublicSalonProfile(slug)`      | Public-safe salon profile.                                                                                               |
| `listPublicServicesForSalon(slug)` | Public services and branch-specific starts-from pricing.                                                                 |
| `listPublicReviews(slug)`          | Moderated public reviews only.                                                                                           |
| `listPublicPortfolio(slug)`        | Consent-safe public portfolio media.                                                                                     |

## Public DTO Rules

- Use slugs or opaque public IDs.
- Exclude internal audit, tenant, and private operational fields.
- Include `startsFromPrice` only when price varies.
- Include availability signal as advisory metadata, not final reservation.
- Search read models must expose only public-safe fields required for filtering and sorting.
- Default search sort is rating descending, then public display name ascending, unless a documented ranking policy supersedes it.

## Test Implications

Tests must verify visibility filtering, public/private data exclusion, SEO rendering, filter validation, and search behavior.
