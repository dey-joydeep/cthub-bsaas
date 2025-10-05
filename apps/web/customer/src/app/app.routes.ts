import { Routes } from '@angular/router';
import { authCanMatch } from '@cthub-bsaas/web-core/auth';

export const routes: Routes = [
  { path: '', loadChildren: () => import('@cthub-bsaas/web-public').then(m => m.PUBLIC_ROUTES) },
  { path: '', canMatch: [authCanMatch], loadChildren: () => import('@cthub-bsaas/web-customer').then(m => m.CUSTOMER_ROUTES) },
  { path: '**', redirectTo: '' },
];