import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadChildren: () => import('@cthub-bsaas/web-admin').then(m => m.ADMIN_ROUTES) },
];