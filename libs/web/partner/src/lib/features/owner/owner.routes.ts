import { Routes } from '@angular/router';
import { OwnerDashboardComponent } from './owner-dashboard/owner-dashboard.component';
import { SalonManagementComponent } from './salon-management/salon-management.component';
import { AppointmentManagementComponent } from './appointment-management/appointment-management.component';
import { StaffManagementComponent } from './staff-management/staff-management.component';

export const OWNER_ROUTES: Routes = [
  {
    path: '',
    component: OwnerDashboardComponent,
    pathMatch: 'full',
  },
  {
    path: 'salon',
    component: SalonManagementComponent,
  },
  {
    path: 'appointments',
    component: AppointmentManagementComponent,
  },
  {
    path: 'staff',
    component: StaffManagementComponent,
  },
];
