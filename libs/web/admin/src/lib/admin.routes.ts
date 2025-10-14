import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  { path: 'auth', loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES) },
];
