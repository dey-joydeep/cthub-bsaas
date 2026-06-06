import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadChildren: () => import('@cthub-bsaas/web-customer').then((m) => m.CUSTOMER_ROUTES) },
  { path: '**', redirectTo: 'dashboard' },
];
