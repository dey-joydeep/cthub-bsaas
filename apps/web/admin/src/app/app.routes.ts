import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadChildren: () => import('@cthub-bsaas/web-admin').then((m) => m.ADMIN_ROUTES) },
  { path: 'auth', loadChildren: () => import('@cthub-bsaas/web-admin/auth').then((m) => m.AUTH_ROUTES) },
  { path: '**', redirectTo: '' },
];
