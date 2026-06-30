import { authGuard } from '@cthub-bsaas/web-core-auth';
import { Routes } from '@angular/router';
// Components




// Guards
export const AUTH_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent),
    title: 'Login',
    canActivate: [authGuard],
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register.component').then(m => m.RegisterComponent),
    title: 'Register',
    canActivate: [authGuard],
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./components/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    title: 'Forgot Password',
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
