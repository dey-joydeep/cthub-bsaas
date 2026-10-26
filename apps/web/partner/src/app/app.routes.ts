import { Routes } from '@angular/router';
import { AUTH_ROUTES } from '@cthub-bsaas/web-partner/auth';
import { authCanMatch, roleGuard } from '@cthub-bsaas/web-core-auth';
import { SALON_OWNER_SETTINGS_ROUTES } from '@cthub-bsaas/web-partner';
import { UserRole } from '@cthub-bsaas/shared';

export const routes: Routes = [
  { path: 'auth', children: AUTH_ROUTES },
  { path: 'settings', redirectTo: 'owner/settings', pathMatch: 'full' },
  {
    path: 'owner/settings',
    canMatch: [authCanMatch],
    canActivate: [roleGuard],
    data: { roles: [UserRole.OWNER] },
    children: SALON_OWNER_SETTINGS_ROUTES,
  },
  {
    path: 'owner/branches',
    canMatch: [authCanMatch],
    canActivate: [roleGuard],
    data: { roles: [UserRole.OWNER, UserRole.STAFF] },
    children: SALON_OWNER_SETTINGS_ROUTES,
  },
  { path: '', loadChildren: () => import('@cthub-bsaas/web-partner').then((m) => m.PARTNER_ROUTES) },
  { path: '**', redirectTo: '' },
];
