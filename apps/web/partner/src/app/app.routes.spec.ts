import { authCanMatch, roleGuard } from '@cthub-bsaas/web-core-auth';
import { UserRole } from '@cthub-bsaas/shared';

import { routes } from './app.routes';
import { UnauthorizedComponent } from './unauthorized.component';

describe('partner app routes', () => {
  it('guards business settings routes behind authenticated owner access', () => {
    const businessSettingsRoute = routes.find((route) => route.path === 'business/settings');
    const businessBranchesRoute = routes.find((route) => route.path === 'business/branches');
    const settingsAliasRoute = routes.find((route) => route.path === 'settings');
    const unauthorizedRoute = routes.find((route) => route.path === 'unauthorized');

    expect(unauthorizedRoute).toEqual({
      path: 'unauthorized',
      component: UnauthorizedComponent,
    });
    expect(businessSettingsRoute?.canMatch).toEqual([authCanMatch]);
    expect(businessBranchesRoute?.canMatch).toEqual([authCanMatch]);
    expect(businessSettingsRoute?.canActivate).toEqual([roleGuard]);
    expect(businessBranchesRoute?.canActivate).toEqual([roleGuard]);
    expect(businessSettingsRoute?.data).toEqual({ roles: [UserRole.OWNER, UserRole.ADMIN] });
    expect(businessBranchesRoute?.data).toEqual({
      roles: [UserRole.OWNER, UserRole.STAFF],
      requireManagerCapability: true,
      redirectUrl: '/unauthorized',
    });
    expect(settingsAliasRoute).toEqual({
      path: 'settings',
      redirectTo: 'business/settings',
      pathMatch: 'full',
    });
  });

  it('provides backwards-compatible redirects for legacy owner routes', () => {
    expect(routes.find((r) => r.path === 'owner/settings')?.redirectTo).toBe('business/settings');
    expect(routes.find((r) => r.path === 'owner/branches')?.redirectTo).toBe('business/branches');
    expect(routes.find((r) => r.path === 'owner/staff')?.redirectTo).toBe('business/staff');
    expect(routes.find((r) => r.path === 'owner/services')?.redirectTo).toBe('business/services');
  });

  it('provides resource shortcuts for staff and services', () => {
    expect(routes.find((r) => r.path === 'staff')?.redirectTo).toBe('business/staff');
    expect(routes.find((r) => r.path === 'services')?.redirectTo).toBe('business/services');
    expect(routes.find((r) => r.path === 'branches')?.redirectTo).toBe('business/branches');
  });
});
