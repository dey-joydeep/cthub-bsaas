import { Injector, runInInjectionContext } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, type GuardResult, type MaybeAsync } from '@angular/router';
import { Observable, firstValueFrom, of } from 'rxjs';
import { CURRENT_USER, type CurrentUserMin, type CurrentUserPort } from '../interfaces/current-user.port';
import { authGuard } from './auth.guard';

type MutableCurrentUserPort = {
  currentUser$: Observable<CurrentUserMin | null>;
  isAuthenticated$: Observable<boolean>;
  redirectUrl: string | null;
};

class MockRouter {
  createUrlTree(commands: readonly string[]): UrlTree {
    return {
      toString: () => commands.join('/'),
    } as UrlTree;
  }
}

describe('AuthGuard', () => {
  let currentUserPort: MutableCurrentUserPort;
  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = { url: '/test' } as RouterStateSnapshot;

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

  it('should allow activation if user is authenticated', async () => {
    currentUserPort.currentUser$ = of({ id: '1', role: 'customer' });

    const result = await resolveGuardResult(runInInjectionContext(injector, () => authGuard(mockRoute, mockState)));

    expect(result).toBe(true);
  });

  it('should redirect to /auth/login if user is not authenticated', async () => {
    currentUserPort.currentUser$ = of(null);

    const result = await resolveGuardResult(runInInjectionContext(injector, () => authGuard(mockRoute, mockState)));

    expect(result.toString()).toContain('auth/login');
  });
});

function resolveGuardResult(result: MaybeAsync<GuardResult>): Promise<GuardResult> {
  if (result instanceof Observable) {
    return firstValueFrom(result);
  }

  return Promise.resolve(result);
}
