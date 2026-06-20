import { Routes } from '@angular/router';
import { AUTH_ROUTES } from '@cthub-bsaas/web-admin/auth';

export const routes: Routes = [
  { path: 'auth', children: AUTH_ROUTES },
  { path: '', redirectTo: 'auth', pathMatch: 'full' },
  { path: '**', redirectTo: 'auth' },
];
