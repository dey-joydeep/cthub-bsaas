# `libs/web/customer` — Augmentation (Existing Library)

We add routes and signed‑in pages to your current `web/customer` library. Your `auth` sub‑lib remains unchanged.

## Placement

```
libs/web/customer/
└── src/lib/
    ├── customer.routes.ts
    └── pages/
        ├── profile/profile.page.ts
        ├── bookings/bookings.page.ts
        └── review-compose/review-compose.page.ts

libs/web/customer/auth/src/lib/components/
  ├── login/
  ├── register/
  └── forgot-password/
```

### Routes

```ts
export const CUSTOMER_ROUTES: Routes = [
  { path: 'me', loadComponent: () => import('./pages/profile/profile.page').then(m => m.ProfilePage) },
  { path: 'bookings', loadComponent: () => import('./pages/bookings/bookings.page').then(m => m.BookingsPage) },
  { path: ':city/:tenantSlug/review', loadComponent: () => import('./pages/review-compose/review-compose.page').then(m => m.ReviewComposePage) },
];
```

### Boundaries

- Allowed deps: `web/ui`, `web/core`, `web/config`
- Forbidden deps: `web/public`

### Notes

- Components should be **standalone** (Angular 20).
- Reuse existing auth components for login/register flows.
