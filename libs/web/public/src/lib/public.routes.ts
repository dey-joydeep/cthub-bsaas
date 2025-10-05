import { Routes } from '@angular/router';

export const PUBLIC_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
  { path: ':city/salons', loadComponent: () => import('./features/salon/salon-list/salon-list.component').then(m => m.SalonListComponent) },
  { path: ':city/:tenantSlug', loadComponent: () => import('./features/salon/tenant/tenant.component').then(m => m.TenantComponent) },
  { path: 'search', loadComponent: () => import('./features/salon/salon-search/salon-search.component').then(m => m.SalonSearchComponent) },
  { path: 'info/terms', loadComponent: () => import('./static/terms/terms.component').then(m => m.TermsComponent) },
  { path: 'info/privacy', loadComponent: () => import('./static/privacy/privacy.component').then(m => m.PrivacyComponent) },
  { path: 'info/faq', loadComponent: () => import('./static/faq/faq.component').then(m => m.FaqComponent) },
];
