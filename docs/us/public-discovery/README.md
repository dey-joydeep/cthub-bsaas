# Public Discovery User Stories

**Date:** 2026-05-11
**Status:** Current planning source

## Owner Outcome

As a prospective customer, I want to discover salons, services, prices, ratings, offers, and availability so that I can choose and book with confidence.

## Actors

- Prospective Customer
- Customer
- Salon Owner
- Marketing Staff

## Primary Screens Or Workflows

- Public home page
- Service search
- Salon listing
- Salon public profile
- Offer listing
- Portfolio preview
- Review preview

## User Stories

### DISC-US-001: Public home

As a prospective customer, I want a clear public home page with service search and location search so that I can start finding a salon quickly.

### DISC-US-002: Salon listing

As a prospective customer, I want salon listings with rating, location, services, price signal, and available slots so that I can compare options.

### DISC-US-003: Salon profile

As a prospective customer, I want a salon profile with services, staff, photos, reviews, address, hours, and policies so that I can decide whether to book.

### DISC-US-004: Featured services and offers

As a customer, I want to see featured services, offers, and packages so that I can choose relevant deals.

### DISC-US-005: Portfolio discovery

As a customer, I want to browse before/after work and style examples so that I can trust the salon's capability.

## Functional Requirements

- Search by service, location, salon name, category, and popular search terms.
- Show salon cards with name, rating, review count, address area, services, offers, and booking CTA.
- Show service cards with image, title, description, duration, starting price, and availability signal.
- Show public profile with branch hours, map, cancellation policy, staff highlights, reviews, and portfolio.
- Public pages must support SEO and SSR.

## Business Rules And Edge Cases

- Only active salons and active branches should appear publicly.
- Only online-visible services should appear in public booking.
- Prices shown publicly must match branch/service configuration or clearly say "starts from".
- Reviews must follow moderation rules before public display.
- Portfolio media must not expose private customer data without consent.

## Acceptance Criteria

- Given I search for a service and city, when results load, then matching active salons are shown with booking CTA.
- Given a salon is inactive, when public search runs, then the salon is not shown.
- Given a service is not online-visible, when public profile loads, then the service is hidden from booking.
- Given a salon has reviews and portfolio media, when I open profile, then public-approved content is visible.

## Non-Functional Requirements

- Public discovery must be SEO-friendly and SSR-safe.
- Search should remain usable on mobile.
- Media must be optimized for performance.
- Public pages must not expose internal IDs, staff private data, or unpublished prices.
