import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadChildren: () => import('@cthub-bsaas/web-customer').then((m) => m.CUSTOMER_ROUTES) },
  { path: 'auth', loadChildren: () => import('@cthub-bsaas/web-customer/auth').then((m) => m.AUTH_ROUTES) },
  { path: '**', redirectTo: '' },
];
