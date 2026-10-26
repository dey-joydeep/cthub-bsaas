# Broader Context: Multi-Phase Frontend Restructuring

This document outlines the high-level strategy for the ongoing frontend restructuring. The changes described in the other documents (`00` to `30`) are the first phase of a larger initiative.

## The Goal

The ultimate goal is to refactor the three main frontend applications (`customer`, `admin`, and `partner`) from monolithic `apps/web/*` structures into a more modular, library-based architecture within `libs/web/*`.

This will achieve:

- Better code sharing and reuse.
- Improved separation of concerns.
- More scalable and maintainable frontend codebase.

## The Phases

The restructuring will be done in phases:

1.  **Phase 1 (Current): Customer & Public Libs.** This phase focuses on the `customer` application. It involves creating a new `libs/web/public` for shared, public-facing pages and augmenting the existing `libs/web/customer` for authenticated user flows. This serves as the blueprint for the other applications.

2.  **Phase 2: Partner App.** The `partner` application will be refactored into a library-based structure, following the pattern established in Phase 1.

3.  **Phase 3: Admin App.** The `admin` application will be the final one to be restructured.

## Foundation for Future Development

This restructuring is a foundational task. Once complete, it will provide a solid and consistent architecture for future feature development and UI polishing across all frontend applications.
