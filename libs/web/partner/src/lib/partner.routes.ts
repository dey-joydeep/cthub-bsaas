import { Routes } from '@angular/router';

export const PARTNER_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent) },
  { path: 'auth', loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES) },
  // { path: 'appointments', loadChildren: () => import('./features/appointment/appointment.routes').then((m) => m.APPOINTMENT_ROUTES) },
  { path: 'owner', loadChildren: () => import('./features/owner/owner.routes').then((m) => m.OWNER_ROUTES) },
  { path: 'portfolio', loadComponent: () => import('./features/portfolio/portfolio.component').then((m) => m.PortfolioComponent) },
  {
    path: 'partner-products',
    loadComponent: () => import('./features/partner-products/product-management').then((m) => m.ProductManagement),
  },
  { path: 'profile', loadComponent: () => import('./features/profile/profile.component').then((m) => m.ProfileComponent) },
  // { path: 'reviews', loadComponent: () => import('./features/reviews/reviews.component').then((m) => m.ReviewsComponent) },
  // { path: 'salon', loadChildren: () => import('./features/salon/salon.routes').then((m) => m.SALON_ROUTES) },
  // {
  //   path: 'partner-services',
  //   loadComponent: () => import('./features/partner-services/service-management.component').then((m) => m.ServiceManagementComponent),
  // },
  // { path: 'settings', loadComponent: () => import('./features/settings/settings.component').then((m) => m.SettingsComponent) },
  // { path: 'tenant-staff', loadChildren: () => import('./features/tenant-staff/tenant-staff.routes').then((m) => m.TENANT_STAFF_ROUTES) },
  // {
  //   path: 'subscriptions',
  //   loadComponent: () => import('./features/subscriptions/subscriptions.component').then((m) => m.SubscriptionsComponent),
  // },
  // { path: 'theme', loadComponent: () => import('./features/theme/theme.component').then((m) => m.ThemeComponent) },
];
