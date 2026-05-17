# App Shell Wireframes

**Date:** 2026-05-18
**Status:** Wireframe specification pending live Penpot board

## Penpot Status

Live Penpot board creation is pending. First MCP attempt on 2026-05-18 failed with a transport/deserialization error.

## Required Frames

| Frame ID | Purpose |
| --- | --- |
| `app-shell.partner.desktop` | Partner layout with sidebar, header, business/branch selector, profile menu, notification count. |
| `app-shell.partner.mobile` | Partner mobile header, bottom shortcuts, branch selector drawer. |
| `app-shell.customer.public.desktop` | Public customer header with discovery navigation and auth entry. |
| `app-shell.customer.private.mobile` | Customer mobile shell with profile, bookings, notifications, cart. |
| `app-shell.admin.desktop` | Platform admin shell with support/admin navigation and audit entry. |

## States To Draw

- loading shell context;
- forbidden branch context;
- notification empty/error;
- unsaved changes confirmation;
- compact mobile menu.
