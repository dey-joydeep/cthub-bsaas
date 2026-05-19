# Public Discovery Web Specification

**Date:** 2026-05-18
**Status:** Current planning baseline

## Routes

| Route | Screen ID |
| --- | --- |
| `/` | `public.home` |
| `/search` | `public.search` |
| `/salons/:slug` | `public.salonProfile` |
| `/salons/:slug/services/:serviceSlug` | `public.serviceDetail` |

## Screen Requirements

- Home must expose search by service and location.
- Search results must support filters, sorting, empty state, and mobile-friendly cards.
- Salon profile must include services, hours, address/map, policies, staff highlights, photos, reviews, and booking CTA.
- Service detail must show duration, starts-from price, branch availability signal, and booking entry.

## SEO And SSR

- Public pages must render meaningful title, description, canonical URL, and public content server-side.
- Pages must not depend on client-only JavaScript for primary public content.
- Private customer data must not be embedded in public SSR responses.
