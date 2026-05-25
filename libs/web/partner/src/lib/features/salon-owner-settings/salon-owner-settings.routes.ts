import { Routes } from '@angular/router';

import { SalonOwnerSettingsComponent } from './salon-owner-settings.component';

export const SALON_OWNER_SETTINGS_ROUTES: Routes = [
  {
    path: '',
    component: SalonOwnerSettingsComponent,
  },
  {
    path: 'business',
    component: SalonOwnerSettingsComponent,
  },
];
