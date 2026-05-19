# Public Discovery Test Specification

**Date:** 2026-05-18
**Status:** Current planning baseline

## Backend Tests

- Search excludes inactive/private salons.
- Search excludes non-public services.
- Public profile excludes private fields.
- Review list includes moderated public reviews only.
- Filter validation returns documented errors.

## Web Tests

- Public home SSR renders search content.
- Search result empty state is usable.
- Salon profile renders SEO metadata.
- Mobile filters remain keyboard accessible.
- Booking CTA passes selected public context to booking flow.

## E2E Candidates

- Anonymous user searches by service and city, opens salon profile, starts booking.
- Private salon slug returns public 404.
