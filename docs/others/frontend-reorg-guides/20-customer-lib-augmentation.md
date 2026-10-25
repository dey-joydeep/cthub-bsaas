# `libs/web/customer` — Augmentation (Existing Library)

We add routes and signed‑in pages to your current `web/customer` library. Your `auth` sub‑lib remains unchanged.

## Placement

```
libs/web/customer/
└── src/lib/
    ├── customer.routes.ts
    └── features/
        ├── profile/profile.page.ts
        └── appointments/appointment-list.component.ts

libs/web/customer/auth/src/lib/components/
  ├── login/
  ├── register/
  └── forgot-password/
```

### Routes

```ts
export const CUSTOMER_ROUTES: Routes = [
  { path: 'me', loadComponent: () => import('./features/profile/profile.page').then((m) => m.ProfilePage) },
  {
    path: 'appointments',
    loadComponent: () => import('./features/appointments/appointment-list.component').then((m) => m.AppointmentListComponent),
  },
];
```

### Boundaries

- Allowed deps: `web/ui`, `web/core`, `web/config`
- Forbidden deps: `web/public`

### Notes

- Components should be **standalone** (Angular 20).
- Reuse existing auth components for login/register flows.
