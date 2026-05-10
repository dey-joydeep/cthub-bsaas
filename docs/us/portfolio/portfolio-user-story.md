# Portfolio And Style Inspiration User Stories

**Date:** 2026-05-11
**Status:** Current planning source

## Owner Outcome

As a salon owner, I want to showcase portfolio work and style inspiration so that customers can trust service quality and book specific looks.

## Actors

- Salon Owner
- Service Staff
- Customer
- Branch Manager

## Primary Screens Or Workflows

- Portfolio gallery
- Portfolio album editor
- Staff portfolio
- Style inspiration browser
- Book-this-style CTA

## User Stories

### PORT-US-001: Salon portfolio

As a salon owner, I want to upload and organize approved work photos so that public visitors can see service quality.

### PORT-US-002: Staff portfolio

As a service staff member, I want my approved work linked to my profile so that customers can choose me for relevant services.

### PORT-US-003: Style inspiration

As a customer, I want to save style examples and share them during booking so that staff understands my preference.

### PORT-US-004: Book from portfolio

As a customer, I want to book a service from a portfolio item so that I can request a similar look.

## Functional Requirements

- Upload portfolio media with caption, service link, staff link, branch, tags, and approval state.
- Organize media into albums.
- Support before/after presentation where consent exists.
- Allow customer save/share of inspiration.
- Provide public filtering by service, staff, tag, and branch.

## Business Rules And Edge Cases

- Customer-identifiable media requires consent before public use.
- Hidden/inactive staff should not be promoted publicly, but historical portfolio ownership remains.
- Portfolio item must not promise exact outcome; copy should say "inspired by" or "similar style".
- Removed media must not remain publicly accessible through stale URLs.

## Acceptance Criteria

- Given owner uploads approved media, when public salon profile loads, then the media appears in portfolio.
- Given media lacks consent, when public profile loads, then the media is not shown publicly.
- Given a portfolio item links to a service, when customer clicks book, then booking starts with that service preselected.

## Non-Functional Requirements

- Media must be optimized and scanned/validated.
- Portfolio pages must be mobile-friendly and SEO-safe where public.
- Access to upload/edit must be role-protected.
