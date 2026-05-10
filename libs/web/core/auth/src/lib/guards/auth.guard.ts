import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { CURRENT_USER } from '../interfaces/current-user.port';

/**
 * Auth guard that checks if user is authenticated
 * Redirects to login page if not authenticated
 */
export const authGuard: CanActivateFn = (route, state) => {
  const currentUserService = inject(CURRENT_USER);
  const router = inject(Router);

  const requiredRoles = (route.data?.['roles'] as string[] | undefined) ?? null;
  const requiresVerified = (route.data?.['requiresVerified'] as boolean | undefined) ?? false;

  return currentUserService.currentUser$.pipe(
    take(1),
    map((user) => {
      if (user) {
        // Role-based authorization (optional via route data)
        if (requiredRoles && !requiredRoles.includes(user.role)) {
          return router.createUrlTree(['/']);
        }

        // Verification requirement (optional via route data)
        const isVerified = user.is_verified === true || user.isVerified === true;
        if (requiresVerified && !isVerified) {
          return router.createUrlTree(['/auth/verify']);
        }

        return true;
      }

      // Store the attempted URL for redirecting after login
      currentUserService.redirectUrl = state.url;

      // Navigate to login page
      return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
    }),
  );
};

/**
 * Public guard that checks if user is not authenticated
 * Redirects to home if already authenticated
 */
export const publicGuard: CanActivateFn = () => {
  const currentUserService = inject(CURRENT_USER);
  const router = inject(Router);

  return currentUserService.currentUser$.pipe(
    take(1),
    map((user) => {
      if (!user) {
        return true;
      }

      // User is already logged in, redirect to home
      const target = currentUserService.redirectUrl || '/';
      // Clear redirect to avoid stale navigation loops
      currentUserService.redirectUrl = null;
      return router.createUrlTree([target]);
    }),
  );
};
