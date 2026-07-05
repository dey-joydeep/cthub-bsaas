import { Routes } from '@angular/router';
import { SalonListComponent } from './components/salon-list/salon-list.component';
import { SalonProfileComponent } from './components/salon-profile/salon-profile.component';
import { SalonSearchComponent } from './components/salon-search/salon-search.component';
import { TopSalonsComponent } from './components/top-salons/top-salons.component';

export const SALON_ROUTES: Routes = [
  { path: '', component: SalonListComponent },
  { path: 'profile/:id', component: SalonProfileComponent },
  { path: 'search', component: SalonSearchComponent },
  { path: 'top', component: TopSalonsComponent },
];
