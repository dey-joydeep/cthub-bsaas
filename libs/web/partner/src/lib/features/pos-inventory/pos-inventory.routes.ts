import { Routes } from '@angular/router';

export const POS_INVENTORY_ROUTES: Routes = [
  {
    path: 'pos',
    loadComponent: () => import('./pos.component').then((m) => m.PosComponent),
  },
  {
    path: 'inventory',
    loadComponent: () => import('./inventory.component').then((m) => m.InventoryComponent),
  },
];
