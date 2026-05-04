import { Routes } from '@angular/router';
import { authGuard } from '@cthub-bsaas/web-core-auth';
import { UserComponent } from './user.component';
import { ProfileSettingsComponent } from './profile-settings.component';

export const USER_ROUTES: Routes = [
  {
    path: '',
    component: UserComponent,
    canActivate: [authGuard],
    title: 'User Management',
  },
  {
    path: 'profile',
    component: ProfileSettingsComponent,
    canActivate: [authGuard],
    title: 'Profile Settings',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
