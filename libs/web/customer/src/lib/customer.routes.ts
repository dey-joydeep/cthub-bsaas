import { Routes } from '@angular/router';

import { CUSTOMER_APP_ROUTES } from './features/customer-app/customer-app.routes';

export const CUSTOMER_ROUTES: Routes = [
  ...CUSTOMER_APP_ROUTES,
  { path: 'auth', loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES) },
];
