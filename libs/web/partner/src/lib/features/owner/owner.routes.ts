import { Routes } from '@angular/router';

export const OWNER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./owner-dashboard/owner-dashboard.component').then((m) => m.OwnerDashboardComponent),
    pathMatch: 'full',
  },
  {
    path: 'salon',
    loadComponent: () => import('./salon-management/salon-management.component').then((m) => m.SalonManagementComponent),
  },
  {
    path: 'appointments',
    loadComponent: () => import('./appointment-management/appointment-management.component').then((m) => m.AppointmentManagementComponent),
  },
  {
    path: 'staff',
    loadComponent: () => import('./staff-management/staff-management.component').then((m) => m.StaffManagementComponent),
  },
];
