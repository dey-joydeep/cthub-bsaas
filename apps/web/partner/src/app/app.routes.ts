import { Routes } from '@angular/router';
import { AUTH_ROUTES } from '@cthub-bsaas/web-partner/auth';
import { authCanMatch, roleGuard } from '@cthub-bsaas/web-core-auth';
import { UserRole } from '@cthub-bsaas/shared';
import { UnauthorizedComponent } from './unauthorized.component';

export const routes: Routes = [
  { path: 'auth', children: AUTH_ROUTES },
  { path: 'settings', redirectTo: 'business/settings', pathMatch: 'full' },
  { path: 'unauthorized', component: UnauthorizedComponent },
  {
    path: 'business/settings',
    canMatch: [authCanMatch],
    canActivate: [roleGuard],
    data: { roles: [UserRole.OWNER, UserRole.ADMIN] },
    loadChildren: () => import('@cthub-bsaas/web-partner').then((m) => m.SALON_OWNER_SETTINGS_ROUTES),
  },
  {
    path: 'business/branches',
    canMatch: [authCanMatch],
    canActivate: [roleGuard],
    data: {
      roles: [UserRole.OWNER, UserRole.STAFF],
      requireManagerCapability: true,
      redirectUrl: '/unauthorized',
    },
    loadChildren: () => import('@cthub-bsaas/web-partner').then((m) => m.SALON_OWNER_SETTINGS_ROUTES),
  },
  {
    path: 'business/staff',
    canMatch: [authCanMatch],
    canActivate: [roleGuard],
    data: {
      roles: [UserRole.OWNER, UserRole.STAFF, UserRole.ADMIN],
      catalogTab: 'staff',
    },
    loadChildren: () => import('@cthub-bsaas/web-partner').then((m) => m.STAFF_SERVICE_CATALOG_ROUTES),
  },
  {
    path: 'business/services',
    canMatch: [authCanMatch],
    canActivate: [roleGuard],
    data: {
      roles: [UserRole.OWNER, UserRole.STAFF, UserRole.ADMIN],
      catalogTab: 'services',
    },
    loadChildren: () => import('@cthub-bsaas/web-partner').then((m) => m.STAFF_SERVICE_CATALOG_ROUTES),
  },
  // Resource path shortcuts
  { path: 'staff', redirectTo: 'business/staff', pathMatch: 'full' },
  { path: 'services', redirectTo: 'business/services', pathMatch: 'full' },
  { path: 'branches', redirectTo: 'business/branches', pathMatch: 'full' },
  // Backwards-compatible legacy redirects from /owner/* to /business/*
  { path: 'owner/settings', redirectTo: 'business/settings', pathMatch: 'full' },
  { path: 'owner/branches', redirectTo: 'business/branches', pathMatch: 'full' },
  { path: 'owner/staff', redirectTo: 'business/staff', pathMatch: 'full' },
  { path: 'owner/services', redirectTo: 'business/services', pathMatch: 'full' },
  { path: '', loadChildren: () => import('@cthub-bsaas/web-partner').then((m) => m.PARTNER_ROUTES) },
  { path: '**', redirectTo: '' },
];
