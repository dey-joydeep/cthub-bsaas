import { publicGuard } from '@cthub-bsaas/web-core-auth';
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
    loadComponent: () => import('./components/login/login.component').then((m) => m.LoginComponent),
    title: 'Login',
    canActivate: [publicGuard],
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register.component').then((m) => m.RegisterComponent),
    title: 'Register',
    canActivate: [publicGuard],
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./components/forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent),
    title: 'Forgot Password',
    canActivate: [publicGuard],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
