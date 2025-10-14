import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadChildren: () => import('@cthub-bsaas/web-partner').then(m => m.PARTNER_ROUTES) },
];