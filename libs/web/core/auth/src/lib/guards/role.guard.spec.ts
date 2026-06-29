import { Injector, runInInjectionContext } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, type GuardResult, type MaybeAsync } from '@angular/router';
import { Observable, firstValueFrom, of } from 'rxjs';

import { CURRENT_USER, type CurrentUserMin, type CurrentUserPort } from '../interfaces/current-user.port';
import { roleGuard } from './role.guard';

type MutableCurrentUserPort = {
  currentUser$: Observable<CurrentUserMin | null>;
  isAuthenticated$: Observable<boolean>;
  redirectUrl: string | null;
};

class MockRouter {
  createUrlTree(commands: readonly string[], extras?: { queryParams?: Record<string, string> }): UrlTree {
    return {
      toString: () => {
        const path = commands.join('/');
        const query = extras?.queryParams
          ? `?${new URLSearchParams(extras.queryParams).toString()}`
          : '';
        return `${path}${query}`;
      },
    } as UrlTree;
  }
}

describe('roleGuard', () => {
  let currentUserPort: MutableCurrentUserPort;
  let injector: Injector;

  beforeEach(() => {
    currentUserPort = {
      currentUser$: of(null),
      isAuthenticated$: of(false),
      redirectUrl: null,
    };

    injector = Injector.create({
      providers: [
        { provide: CURRENT_USER, useValue: currentUserPort satisfies CurrentUserPort },
        { provide: Router, useClass: MockRouter },
      ],
    });
  });

  it('allows uppercase user roles to satisfy lowercase route roles', async () => {
    currentUserPort.currentUser$ = of({ id: 'owner-1', role: 'OWNER' });
    const route = { data: { roles: ['owner'] } } as ActivatedRouteSnapshot;
    const state = { url: '/owner/settings' } as RouterStateSnapshot;

    const result = await resolveGuardResult(runInInjectionContext(injector, () => roleGuard(route, state)));

    expect(result).toBe(true);
  });

  it('redirects unauthenticated users to login with the attempted returnUrl', async () => {
    const route = { data: { roles: ['owner'] } } as ActivatedRouteSnapshot;
    const state = { url: '/owner/settings' } as RouterStateSnapshot;

    const result = await resolveGuardResult(runInInjectionContext(injector, () => roleGuard(route, state)));

    expect(currentUserPort.redirectUrl).toBe('/owner/settings');
    expect(result.toString()).toContain('auth/login');
    expect(result.toString()).toContain('returnUrl=%2Fowner%2Fsettings');
  });

  it('redirects to unauthorized when the current user is missing a role', async () => {
    currentUserPort.currentUser$ = of({ id: 'owner-1' } as CurrentUserMin);
    const route = { data: { roles: ['owner'] } } as ActivatedRouteSnapshot;
    const state = { url: '/owner/settings' } as RouterStateSnapshot;

    const result = await resolveGuardResult(runInInjectionContext(injector, () => roleGuard(route, state)));

    expect(result.toString()).toContain('/unauthorized');
  });
});

function resolveGuardResult(result: MaybeAsync<GuardResult>): Promise<GuardResult> {
  if (result instanceof Observable) {
    return firstValueFrom(result);
  }

  return Promise.resolve(result);
}
