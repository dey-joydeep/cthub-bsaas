import { Routes } from '@angular/router';

export const CUSTOMER_ROUTES: Routes = [
  { path: 'me', loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent) },
  { path: 'appointments', loadChildren: () => import('./features/appointment/appointment.routes').then(m => m.APPOINTMENT_ROUTES) },
  { path: 'auth', loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES) },
  { path: 'settings', loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent) },

  { path: 'subscriptions', redirectTo: '', pathMatch: 'full' },
  { path: 'reviews', redirectTo: '', pathMatch: 'full' },
];
