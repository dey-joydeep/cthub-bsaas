import { Injector, runInInjectionContext } from '@angular/core';
import { Route, Router, UrlSegment, UrlTree, type GuardResult, type MaybeAsync } from '@angular/router';
import { Observable, firstValueFrom, of } from 'rxjs';

import { CURRENT_USER, type CurrentUserPort } from '../interfaces/current-user.port';
import { authCanMatch } from './authenticated.guard';

type MutableCurrentUserPort = {
  currentUser$: Observable<{ id: string; role: string } | null>;
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

describe('authCanMatch', () => {
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

  it('stores the attempted URL and passes it to login when matching protected routes', async () => {
    const route = { path: 'owner/settings' } as Route;
    const segments = [] as UrlSegment[];

    const result = await resolveGuardResult(runInInjectionContext(injector, () => authCanMatch(route, segments)));

    expect(currentUserPort.redirectUrl).toBe('/owner/settings');
    expect(result.toString()).toContain('auth/login');
    expect(result.toString()).toContain('returnUrl=%2Fowner%2Fsettings');
  });

  it('preserves additional path segments in the attempted URL', async () => {
    const route = { path: 'owner' } as Route;
    const segments = [{ path: 'settings' }, { path: 'advanced' }] as UrlSegment[];

    const result = await resolveGuardResult(runInInjectionContext(injector, () => authCanMatch(route, segments)));

    expect(currentUserPort.redirectUrl).toBe('/owner/settings/advanced');
    expect(result.toString()).toContain('returnUrl=%2Fowner%2Fsettings%2Fadvanced');
  });
});

function resolveGuardResult(result: MaybeAsync<GuardResult>): Promise<GuardResult> {
  if (result instanceof Observable) {
    return firstValueFrom(result);
  }

  return Promise.resolve(result);
}
