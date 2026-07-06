# `apps/web/customer` — Thin Shell

App should only bootstrap, wire SSR, and compose routes.

## Routes

```ts
import { Routes } from '@angular/router';
import { authCanMatch } from '@beauty-saas/web/core/auth'; // adjust alias if different

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('@beauty-saas/web/public').then((m) => m.PUBLIC_ROUTES),
  },
  {
    path: '',
    canMatch: [authCanMatch],
    loadChildren: () => import('@beauty-saas/web/customer').then((m) => m.CUSTOMER_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
```

## Shell

- `<app-header />` from `libs/web/ui` + `<router-outlet />`.
- Header reacts to auth state for login/register vs profile/logout.

## Styles

- Keep using `libs/web/config/src/styles/styles.css` (Tailwind v4 + Material v3).
- Locales: en, bn, hi.
