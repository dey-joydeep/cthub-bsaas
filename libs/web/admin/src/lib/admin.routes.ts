import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent) },
  { path: 'auth', loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES) },
  { path: 'admin', loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES) },
  { path: 'settings', loadComponent: () => import('./features/settings/settings.component').then((m) => m.SettingsComponent) },
  { path: 'user', loadChildren: () => import('./features/user/user.routes').then((m) => m.USER_ROUTES) },
  { path: 'salon', loadChildren: () => import('./features/salon/salon.module').then((m) => m.SalonModule) },
  {
    path: 'global-products',
    loadComponent: () => import('./features/global-products/product-management.component').then((m) => m.ProductManagementComponent),
  },
  {
    path: 'global-services',
    loadComponent: () => import('./features/global-services/service-management.component').then((m) => m.ServiceManagementComponent),
  },
  {
    path: 'subscribers',
    loadComponent: () => import('./features/subscribers/subscriptions.component').then((m) => m.SubscriptionsComponent),
  },
];
