import { Routes } from '@angular/router';

import { CustomerAppComponent } from './customer-app.component';

export const CUSTOMER_APP_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', component: CustomerAppComponent, data: { view: 'dashboard' } },
  { path: 'book', component: CustomerAppComponent, data: { view: 'book' } },
  { path: 'appointments', component: CustomerAppComponent, data: { view: 'appointments' } },
  { path: 'rewards', component: CustomerAppComponent, data: { view: 'rewards' } },
  { path: 'receipts', component: CustomerAppComponent, data: { view: 'receipts' } },
  { path: 'reviews', component: CustomerAppComponent, data: { view: 'reviews' } },
];
