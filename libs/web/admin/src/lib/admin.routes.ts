import { Routes } from '@angular/router';
import { authGuard } from '@cthub-bsaas/web-core/auth';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [authGuard],
  },
  { path: 'auth', loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES) },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () => import('./features/settings/settings.component').then((m) => m.SettingsComponent),
  },
  {
    path: 'user',
    canActivate: [authGuard],
    loadChildren: () => import('./features/user/user.routes').then((m) => m.USER_ROUTES),
  },
  {
    path: 'salon',
    canActivate: [authGuard],
    loadChildren: () => import('./features/salon/salon.routes').then((m) => m.SALON_ROUTES),
  },
  {
    path: 'global-products',
    canActivate: [authGuard],
    loadComponent: () => import('./features/global-products/product-management.component').then((m) => m.ProductManagementComponent),
  },
  {
    path: 'global-services',
    canActivate: [authGuard],
    loadComponent: () => import('./features/global-services/service-management.component').then((m) => m.ServiceManagementComponent),
  },
  {
    path: 'subscribers',
    canActivate: [authGuard],
    loadComponent: () => import('./features/subscribers/subscriptions.component').then((m) => m.SubscriptionsComponent),
  },
];
