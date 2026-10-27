import { Routes } from '@angular/router';
import { authGuard } from '@cthub-bsaas/web-core-auth';

export const USER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./user.component').then((m) => m.UserComponent),
    canActivate: [authGuard],
    title: 'User Management',
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile-settings.component').then((m) => m.ProfileSettingsComponent),
    canActivate: [authGuard],
    title: 'Profile Settings',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
