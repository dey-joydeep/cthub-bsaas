# Admin Web App

This is the runnable Angular and SSR shell for platform administration. Keep reusable UI and feature behavior in `libs/web/**`; read `libs/web/AGENTS.md` and `apps/web/AGENTS.md` before changing this app.

The Nx project is `web-app-admin`. Read `project.json` for available targets. Common commands from the repository root are `npm exec nx run web-app-admin:serve`, `npm exec nx run web-app-admin:build`, and `npm exec nx run web-app-admin:lint`. App-level browser tests live in `apps/e2e/web/admin/**`; feature unit tests usually belong to the owning library.

Use the current [web specifications](../../../docs/specs/README.md) and [change validation guide](../../../docs/aidd/change-hygiene.md) for the assigned slice.
