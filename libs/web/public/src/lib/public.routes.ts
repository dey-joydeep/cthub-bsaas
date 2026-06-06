import { Routes } from '@angular/router';

export const PUBLIC_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'search',
    loadComponent: () => import('./features/salon/salon-search/salon-search.component').then((m) => m.SalonSearchComponent),
  },
  {
    path: 'salons/:tenantSlug',
    loadComponent: () => import('./features/salon/tenant/tenant.component').then((m) => m.TenantComponent),
  },
];
