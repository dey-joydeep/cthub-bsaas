import { Routes } from '@angular/router';
import { authCanMatch, roleGuard } from '@cthub-bsaas/web-core-auth';
import { UserRole } from '@cthub-bsaas/shared';

export const routes: Routes = [
  { path: 'auth', loadChildren: () => import('@cthub-bsaas/web-partner/auth').then((m) => m.AUTH_ROUTES) },
  {
    path: 'owner/settings',
    canMatch: [authCanMatch],
    canActivate: [roleGuard],
    data: { roles: [UserRole.OWNER] },
    loadChildren: () => import('@cthub-bsaas/web-partner').then((m) => m.SALON_OWNER_SETTINGS_ROUTES),
  },
  {
    path: 'owner/branches',
    canMatch: [authCanMatch],
    canActivate: [roleGuard],
    data: { roles: [UserRole.OWNER] },
    loadChildren: () => import('@cthub-bsaas/web-partner').then((m) => m.SALON_OWNER_SETTINGS_ROUTES),
  },
  { path: '', redirectTo: 'auth', pathMatch: 'full' },
  { path: '**', redirectTo: 'auth' },
];
