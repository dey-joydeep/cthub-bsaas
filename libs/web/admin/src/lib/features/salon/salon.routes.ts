import { Routes } from '@angular/router';

export const SALON_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/salon-list/salon-list.component').then((m) => m.SalonListComponent),
  },
  {
    path: 'search',
    loadComponent: () => import('./components/salon-search/salon-search.component').then((m) => m.SalonSearchComponent),
  },
  {
    path: 'top',
    loadComponent: () => import('./components/top-salons/top-salons.component').then((m) => m.TopSalonsComponent),
  },
  {
    path: 'profile/:id',
    loadComponent: () => import('./components/salon-profile/salon-profile.component').then((m) => m.SalonProfileComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('./components/salon-profile/salon-profile.component').then((m) => m.SalonProfileComponent),
  },
];
