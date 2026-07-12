import { Routes } from '@angular/router';
import { authGuard } from '@cthub-bsaas/web-core/auth';

export const CUSTOMER_ROUTES: Routes = [
  { path: '', redirectTo: 'appointments', pathMatch: 'full' },
  {
    path: 'me',
    loadComponent: () => import('./features/profile/profile.component').then((m) => m.ProfileComponent),
    canActivate: [authGuard],
  },
  {
    path: 'appointments',
    canActivate: [authGuard],
    loadChildren: () => import('./features/appointment/appointment.routes').then((m) => m.APPOINTMENT_ROUTES),
  },
  { path: 'auth', loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES) },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () => import('./features/settings/settings.component').then((m) => m.SettingsComponent),
  },

  { path: 'subscriptions', redirectTo: '', pathMatch: 'full' },
  { path: 'reviews', redirectTo: '', pathMatch: 'full' },
];
