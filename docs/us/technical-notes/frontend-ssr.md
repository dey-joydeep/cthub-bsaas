# Frontend SSR Technical Note

**Date:** 2026-05-11
**Status:** Technical note

## Purpose

This note records frontend SSR expectations. It is not a product user story.

## SSR Expectations

- Angular apps are SSR-enabled unless a project explicitly opts out.
- Browser-only APIs must be guarded with platform checks.
- Public discovery pages should remain SEO-friendly.
- App-shell user stories must be implemented without top-level `window`, `document`, `localStorage`, or `ResizeObserver` access.
- Data that can be shared from server render to browser should use Angular-compatible hydration/transfer mechanisms where appropriate.

## Current Planning Links

- [App Shell And Navigation](../app-shell/README.md)
- [Public Discovery](../public-discovery/README.md)
