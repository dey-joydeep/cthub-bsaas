import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { CURRENT_USER } from '../interfaces/current-user.port';
import { hasManagerCapability } from '@cthub-bsaas/shared';

function extractRoleNames(roles?: readonly unknown[] | null): string[] {
  if (!Array.isArray(roles)) return [];
  return roles
    .map((r) => {
      if (typeof r === 'string') return r.toLowerCase();
      if (r && typeof r === 'object' && typeof (r as { name?: unknown }).name === 'string') {
        return (r as { name: string }).name.toLowerCase();
      }
      return '';
    })
    .filter(Boolean);
}

/**
 * Role guard that checks if user has required roles and optional capabilities.
 * Redirects to unauthorized page or custom redirectUrl if user doesn't have required roles or capabilities.
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

      const unauthorizedUrl = (route.data?.['redirectUrl'] as string | undefined) || '/unauthorized';

      // Check manager capability requirement if specified
      const requiresManagerCapability = route.data?.['requireManagerCapability'] === true;

      // Get required roles from route data
      const requiredRoles = ((route.data?.['roles'] as string[] | undefined) ?? []).map((role) => role.toLowerCase());

      const userRole = typeof user.role === 'string' ? user.role.toLowerCase() : null;
      const userRoles = [
        ...(userRole ? [userRole] : []),
        ...extractRoleNames(user.roles),
      ];

      // If no roles are required, check capability then allow access
      if (!requiredRoles || requiredRoles.length === 0) {
        if (requiresManagerCapability && !hasManagerCapability(user)) {
          return router.createUrlTree([unauthorizedUrl]);
        }
        return true;
      }

      // Check if user has any of the required roles
      if (userRoles.length === 0) {
        return router.createUrlTree([unauthorizedUrl]);
      }
      const hasRequiredRole = requiredRoles.some((role) => userRoles.includes(role));

      if (!hasRequiredRole) {
        return router.createUrlTree([unauthorizedUrl]);
      }

      // If route also requires manager capability, enforce it
      if (requiresManagerCapability && !hasManagerCapability(user)) {
        return router.createUrlTree([unauthorizedUrl]);
      }

      return true;
    }),
  );
};

/**
 * Capability guard that specifically checks if user has branch manager capability.
 * Redirects to unauthorized page if user doesn't have manager capability.
 */
export const managerCapabilityGuard: CanActivateFn = (route, state) => {
  const currentUserService = inject(CURRENT_USER);
  const router = inject(Router);

  return currentUserService.currentUser$.pipe(
    take(1),
    map((user) => {
      if (!user) {
        currentUserService.redirectUrl = state.url;
        return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
      }

      const unauthorizedUrl = (route.data?.['redirectUrl'] as string | undefined) || '/unauthorized';

      if (!hasManagerCapability(user)) {
        return router.createUrlTree([unauthorizedUrl]);
      }

      return true;
    }),
  );
};
