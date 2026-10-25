import { authCanMatch, roleGuard } from '@cthub-bsaas/web-core-auth';
import { UserRole } from '@cthub-bsaas/shared';

import { routes } from './app.routes';
import { UnauthorizedComponent } from './unauthorized.component';

describe('partner app routes', () => {
  it('guards owner settings routes behind authenticated owner access', () => {
    const ownerSettingsRoute = routes.find((route) => route.path === 'owner/settings');
    const ownerBranchesRoute = routes.find((route) => route.path === 'owner/branches');
    const settingsAliasRoute = routes.find((route) => route.path === 'settings');
    const unauthorizedRoute = routes.find((route) => route.path === 'unauthorized');

    expect(unauthorizedRoute).toEqual({
      path: 'unauthorized',
      component: UnauthorizedComponent,
    });
    expect(ownerSettingsRoute?.canMatch).toEqual([authCanMatch]);
    expect(ownerBranchesRoute?.canMatch).toEqual([authCanMatch]);
    expect(ownerSettingsRoute?.canActivate).toEqual([roleGuard]);
    expect(ownerBranchesRoute?.canActivate).toEqual([roleGuard]);
    expect(ownerSettingsRoute?.data).toEqual({ roles: [UserRole.OWNER, UserRole.ADMIN] });
    expect(ownerBranchesRoute?.data).toEqual({
      roles: [UserRole.OWNER, UserRole.STAFF],
      requireManagerCapability: true,
      redirectUrl: '/unauthorized',
    });
    expect(settingsAliasRoute).toEqual({
      path: 'settings',
      redirectTo: 'owner/settings',
      pathMatch: 'full',
    });
  });
});
