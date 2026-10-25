import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router, UrlSegment } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { CURRENT_USER } from '../interfaces/current-user.port';

/**
 * Authenticated guard: allows only authenticated users.
 * Stores attempted URL and redirects unauthenticated users to login.
 */
export const authenticatedGuard: CanActivateFn = (_route, state) => {
  const currentUserService = inject(CURRENT_USER);
  const router = inject(Router);

  return currentUserService.isAuthenticated$.pipe(
    take(1),
    map((isAuthenticated) => {
      if (isAuthenticated) {
        return true;
      }

      // Store the attempted URL for redirecting after login
      currentUserService.redirectUrl = state.url;

      // Navigate to the login page
      return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });
    }),
  );
};

function buildAttemptedUrl(segments: UrlSegment[]): string {
  const segmentPath = segments.map((segment) => segment.path).join('/');
  return segmentPath.length > 0 ? `/${segmentPath}` : '/';
}

export const authCanMatch: CanMatchFn = (_route, segments) => {
  const currentUserService = inject(CURRENT_USER);
  const router = inject(Router);

  return currentUserService.isAuthenticated$.pipe(
    take(1),
    map((isAuthenticated) => {
      if (isAuthenticated) {
        return true;
      }

      const attemptedUrl = buildAttemptedUrl(segments);
      currentUserService.redirectUrl = attemptedUrl;
      return router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: attemptedUrl } });
    }),
  );
};
