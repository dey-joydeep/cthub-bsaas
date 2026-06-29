import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { CURRENT_USER } from '../interfaces/current-user.port';

/**
 * Role guard that checks if user has required roles
 * Redirects to unauthorized page if user doesn't have required roles
 */
export const roleGuard: CanActivateFn = (route, state) => {
  const currentUserService = inject(CURRENT_USER);
  const router = inject(Router);

  return currentUserService.currentUser$.pipe(
    take(1),
    map((user) => {
      // If no user is logged in, redirect to login
      if (!user) {
        currentUserService.redirectUrl = state.url;
        return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
      }

      // Get required roles from route data
      const requiredRoles = ((route.data?.['roles'] as string[] | undefined) ?? []).map((role) => role.toLowerCase());

      // If no roles are required, allow access
      if (!requiredRoles || requiredRoles.length === 0) {
        return true;
      }

      // Check if user has any of the required roles
      const userRole = typeof user.role === 'string' ? user.role.toLowerCase() : null;
      if (!userRole) {
        return router.createUrlTree(['/unauthorized']);
      }
      const hasRequiredRole = requiredRoles.includes(userRole);

      if (hasRequiredRole) {
        return true;
      }

      // User doesn't have required role, redirect to unauthorized
      return router.createUrlTree(['/unauthorized']);
    }),
  );
};
