import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'auth', loadChildren: () => import('@cthub-bsaas/web-partner/auth').then((m) => m.AUTH_ROUTES) },
  { path: 'owner/settings', loadChildren: () => import('@cthub-bsaas/web-partner').then((m) => m.SALON_OWNER_SETTINGS_ROUTES) },
  { path: 'owner/branches', loadChildren: () => import('@cthub-bsaas/web-partner').then((m) => m.SALON_OWNER_SETTINGS_ROUTES) },
  { path: 'owner/staff', loadChildren: () => import('@cthub-bsaas/web-partner').then((m) => m.STAFF_SERVICE_CATALOG_ROUTES) },
  { path: 'owner/services', loadChildren: () => import('@cthub-bsaas/web-partner').then((m) => m.STAFF_SERVICE_CATALOG_ROUTES) },
  { path: 'owner/customers', loadChildren: () => import('@cthub-bsaas/web-partner').then((m) => m.CUSTOMER_CRM_ROUTES) },
  { path: 'owner/appointments', loadChildren: () => import('@cthub-bsaas/web-partner').then((m) => m.APPOINTMENT_SCHEDULING_ROUTES) },
  { path: 'owner', loadChildren: () => import('@cthub-bsaas/web-partner').then((m) => m.POS_INVENTORY_ROUTES) },
  { path: '', redirectTo: 'auth', pathMatch: 'full' },
  { path: '**', redirectTo: 'auth' },
];
