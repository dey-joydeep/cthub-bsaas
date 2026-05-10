import { Routes } from '@angular/router';

export const APPOINTMENT_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./appointment-list/appointment-list.component').then(m => m.AppointmentListComponent),
  },
  {
    path: 'create',
    loadComponent: () => import('./appointment-create/appointment-create.component').then(m => m.AppointmentCreateComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('./appointment-detail/appointment-detail.component').then(m => m.AppointmentDetailComponent),
  },
];