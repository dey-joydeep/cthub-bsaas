import { Injector, runInInjectionContext } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, type GuardResult, type MaybeAsync } from '@angular/router';
import { Observable, firstValueFrom, of } from 'rxjs';

import { CURRENT_USER, type CurrentUserMin, type CurrentUserPort } from '../interfaces/current-user.port';
import { managerCapabilityGuard, roleGuard } from './role.guard';

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
    const route = { data: { roles: ['owner'] } } as unknown as ActivatedRouteSnapshot;
    const state = { url: '/owner/settings' } as RouterStateSnapshot;

    const result = await resolveGuardResult(runInInjectionContext(injector, () => roleGuard(route, state)));

    expect(result).toBe(true);
  });

  it('redirects unauthenticated users to login with the attempted returnUrl', async () => {
    const route = { data: { roles: ['owner'] } } as unknown as ActivatedRouteSnapshot;
    const state = { url: '/owner/settings' } as RouterStateSnapshot;

    const result = await resolveGuardResult(runInInjectionContext(injector, () => roleGuard(route, state)));

    expect(currentUserPort.redirectUrl).toBe('/owner/settings');
    expect(result.toString()).toContain('auth/login');
    expect(result.toString()).toContain('returnUrl=%2Fowner%2Fsettings');
  });

  it('redirects to unauthorized when the current user is missing a role', async () => {
    currentUserPort.currentUser$ = of({ id: 'owner-1' } as CurrentUserMin);
    const route = { data: { roles: ['owner'] } } as unknown as ActivatedRouteSnapshot;
    const state = { url: '/owner/settings' } as RouterStateSnapshot;

    const result = await resolveGuardResult(runInInjectionContext(injector, () => roleGuard(route, state)));

    expect(result.toString()).toContain('/unauthorized');
  });

  it('allows manager-capable staff access when requireManagerCapability is true', async () => {
    currentUserPort.currentUser$ = of({
      id: 'staff-1',
      role: 'staff',
      managedBranchIds: ['branch-1'],
    });
    const route = {
      data: { roles: ['owner', 'staff'], requireManagerCapability: true },
    } as unknown as ActivatedRouteSnapshot;
    const state = { url: '/owner/branches' } as RouterStateSnapshot;

    const result = await resolveGuardResult(runInInjectionContext(injector, () => roleGuard(route, state)));

    expect(result).toBe(true);
  });

  it('blocks non-manager staff when requireManagerCapability is true', async () => {
    currentUserPort.currentUser$ = of({
      id: 'staff-2',
      role: 'staff',
      managedBranchIds: [],
    });
    const route = {
      data: { roles: ['owner', 'staff'], requireManagerCapability: true },
    } as unknown as ActivatedRouteSnapshot;
    const state = { url: '/owner/branches' } as RouterStateSnapshot;

    const result = await resolveGuardResult(runInInjectionContext(injector, () => roleGuard(route, state)));

    expect(result.toString()).toContain('/unauthorized');
  });

  it('allows owner access when requireManagerCapability is true', async () => {
    currentUserPort.currentUser$ = of({
      id: 'owner-1',
      role: 'owner',
    });
    const route = {
      data: { roles: ['owner', 'staff'], requireManagerCapability: true },
    } as unknown as ActivatedRouteSnapshot;
    const state = { url: '/owner/branches' } as RouterStateSnapshot;

    const result = await resolveGuardResult(runInInjectionContext(injector, () => roleGuard(route, state)));

    expect(result).toBe(true);
  });

  it('handles route with no required roles but with requireManagerCapability', async () => {
    currentUserPort.currentUser$ = of({
      id: 'staff-2',
      role: 'staff',
      managedBranchIds: [],
    });
    const route = {
      data: { requireManagerCapability: true },
    } as unknown as ActivatedRouteSnapshot;
    const state = { url: '/owner/branches' } as RouterStateSnapshot;

    const result = await resolveGuardResult(runInInjectionContext(injector, () => roleGuard(route, state)));

    expect(result.toString()).toContain('/unauthorized');
  });

  describe('managerCapabilityGuard', () => {
    it('redirects unauthenticated users to login', async () => {
      currentUserPort.currentUser$ = of(null);
      const route = {} as unknown as ActivatedRouteSnapshot;
      const state = { url: '/owner/branches' } as RouterStateSnapshot;

      const result = await resolveGuardResult(
        runInInjectionContext(injector, () => managerCapabilityGuard(route, state)),
      );

      expect(currentUserPort.redirectUrl).toBe('/owner/branches');
      expect(result.toString()).toContain('auth/login');
    });

    it('allows manager-capable staff', async () => {
      currentUserPort.currentUser$ = of({
        id: 'staff-1',
        role: 'staff',
        canManageBranches: true,
      });
      const route = {} as unknown as ActivatedRouteSnapshot;
      const state = { url: '/owner/branches' } as RouterStateSnapshot;

      const result = await resolveGuardResult(
        runInInjectionContext(injector, () => managerCapabilityGuard(route, state)),
      );

      expect(result).toBe(true);
    });

    it('redirects non-manager staff to unauthorized', async () => {
      currentUserPort.currentUser$ = of({
        id: 'staff-2',
        role: 'staff',
        managedBranchIds: [],
      });
      const route = {} as unknown as ActivatedRouteSnapshot;
      const state = { url: '/owner/branches' } as RouterStateSnapshot;

      const result = await resolveGuardResult(
        runInInjectionContext(injector, () => managerCapabilityGuard(route, state)),
      );

      expect(result.toString()).toContain('/unauthorized');
    });

    it('allows manager-capable staff with object roles and respects custom redirectUrl', async () => {
      currentUserPort.currentUser$ = of({
        id: 'staff-obj',
        roles: [{ name: 'STAFF' }],
        managedBranchIds: ['branch-1'],
      });
      const route = {
        data: { roles: ['staff'], requireManagerCapability: true, redirectUrl: '/custom-forbidden' },
      } as unknown as ActivatedRouteSnapshot;
      const state = { url: '/owner/branches' } as RouterStateSnapshot;

      const result = await resolveGuardResult(runInInjectionContext(injector, () => roleGuard(route, state)));
      expect(result).toBe(true);

      // Non-manager staff with custom redirectUrl
      currentUserPort.currentUser$ = of({
        id: 'staff-obj-2',
        roles: [{ name: 'STAFF' }],
        managedBranchIds: [],
      });
      const blockedResult = await resolveGuardResult(runInInjectionContext(injector, () => roleGuard(route, state)));
      expect(blockedResult.toString()).toContain('/custom-forbidden');
    });
  });
});

function resolveGuardResult(result: MaybeAsync<GuardResult>): Promise<GuardResult> {
  if (result instanceof Observable) {
    return firstValueFrom(result);
  }

  return Promise.resolve(result);
}
