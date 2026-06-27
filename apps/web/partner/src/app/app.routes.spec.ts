import { authCanMatch, roleGuard } from '@cthub-bsaas/web-core-auth';
import { UserRole } from '@cthub-bsaas/shared';

import { routes } from './app.routes';

describe('partner app routes', () => {
  it('guards owner settings routes behind authenticated owner access', () => {
    const ownerSettingsRoute = routes.find((route) => route.path === 'owner/settings');
    const ownerBranchesRoute = routes.find((route) => route.path === 'owner/branches');
    const settingsAliasRoute = routes.find((route) => route.path === 'settings');

    expect(ownerSettingsRoute?.canMatch).toEqual([authCanMatch]);
    expect(ownerBranchesRoute?.canMatch).toEqual([authCanMatch]);
    expect(ownerSettingsRoute?.canActivate).toEqual([roleGuard]);
    expect(ownerBranchesRoute?.canActivate).toEqual([roleGuard]);
    expect(ownerSettingsRoute?.data).toEqual({ roles: [UserRole.OWNER] });
    expect(ownerBranchesRoute?.data).toEqual({ roles: [UserRole.OWNER, UserRole.STAFF] });
    expect(settingsAliasRoute).toEqual({
      path: 'settings',
      redirectTo: 'owner/settings',
      pathMatch: 'full',
    });
  });
});
