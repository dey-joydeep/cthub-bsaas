import { Routes } from '@angular/router';
import { AUTH_ROUTES } from '@cthub-bsaas/web-partner/auth';
import { authCanMatch, roleGuard } from '@cthub-bsaas/web-core-auth';
import { UserRole } from '@cthub-bsaas/shared';
import { UnauthorizedComponent } from './unauthorized.component';

export const routes: Routes = [
  { path: 'auth', children: AUTH_ROUTES },
  { path: 'settings', redirectTo: 'owner/settings', pathMatch: 'full' },
  { path: 'unauthorized', component: UnauthorizedComponent },
  {
    path: 'owner/settings',
    canMatch: [authCanMatch],
    canActivate: [roleGuard],
    data: { roles: [UserRole.OWNER, UserRole.ADMIN] },
    loadChildren: () => import('@cthub-bsaas/web-partner').then((m) => m.SALON_OWNER_SETTINGS_ROUTES),
  },
  {
    path: 'owner/branches',
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
    path: 'owner/staff',
    data: { catalogTab: 'staff' },
    loadChildren: () => import('@cthub-bsaas/web-partner').then((m) => m.STAFF_SERVICE_CATALOG_ROUTES),
  },
  {
    path: 'owner/services',
    data: { catalogTab: 'services' },
    loadChildren: () => import('@cthub-bsaas/web-partner').then((m) => m.STAFF_SERVICE_CATALOG_ROUTES),
  },
  {
    path: 'owner/customers',
    loadChildren: () => import('@cthub-bsaas/web-partner').then((m) => m.CUSTOMER_CRM_ROUTES),
  },
  { path: '', loadChildren: () => import('@cthub-bsaas/web-partner').then((m) => m.PARTNER_ROUTES) },
  { path: '**', redirectTo: '' },
];
