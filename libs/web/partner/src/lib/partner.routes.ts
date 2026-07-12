import { Routes } from '@angular/router';
import { authGuard } from '@cthub-bsaas/web-core/auth';

export const PARTNER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [authGuard],
  },
  { path: 'auth', loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES) },
  { path: 'appointments', redirectTo: '', pathMatch: 'full' },
  { path: 'appointments/:id', redirectTo: '' },
  {
    path: 'owner',
    canActivate: [authGuard],
    loadChildren: () => import('./features/owner/owner.routes').then((m) => m.OWNER_ROUTES),
  },
  {
    path: 'portfolio',
    canActivate: [authGuard],
    loadComponent: () => import('./features/portfolio/portfolio.component').then((m) => m.PortfolioComponent),
  },
  {
    path: 'partner-products',
    canActivate: [authGuard],
    loadComponent: () => import('./features/partner-products/product-management').then((m) => m.ProductManagement),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile.component').then((m) => m.ProfileComponent),
  },
  { path: 'reviews', redirectTo: '', pathMatch: 'full' },
  { path: 'salon', redirectTo: '', pathMatch: 'full' },
  { path: 'partner-services', redirectTo: '', pathMatch: 'full' },
  { path: 'settings', redirectTo: '', pathMatch: 'full' },
  { path: 'tenant-staff', redirectTo: '', pathMatch: 'full' },
  { path: 'subscriptions', redirectTo: '', pathMatch: 'full' },
  { path: 'theme', redirectTo: '', pathMatch: 'full' },
];
