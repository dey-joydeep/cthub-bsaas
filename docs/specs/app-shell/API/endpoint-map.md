# App Shell API Endpoint Map

**Date:** 2026-05-18
**Status:** Traceability index for project-wide OpenAPI

## Purpose

Map shell-level API needs. The app shell should call only thin context endpoints and delegate feature data to feature APIs.

| Capability | Method | Path | Operation ID | Notes |
| --- | --- | --- | --- | --- |
| Get shell context | `GET` | `/shell/context` | `getShellContext` | Returns actor, app, locale, allowed business/branch context, and navigation permissions. |
| Update locale preference | `PATCH` | `/me/preferences/locale` | `updateMyLocalePreference` | Belongs to account/profile implementation but used by shell. |
| List recent notifications | `GET` | `/me/notifications/recent` | `listMyRecentNotifications` | Belongs to notifications implementation. |
| Get cart summary | `GET` | `/me/cart/summary` | `getMyCartSummary` | Customer app only when cart is enabled. |
| Get POS draft summary | `GET` | `/partner/pos/draft-summary` | `getPartnerPosDraftSummary` | Partner app only when POS is enabled. |

## Contract Rule

These operations are represented in [Project-Wide Supporting OpenAPI](../../project-wide/API/openapi.yaml) or the owning feature OpenAPI contract. This endpoint map remains the shell traceability index.
