import { authCanMatch } from '@cthub-bsaas/web-core-auth';

import { routes } from './app.routes';

describe('partner app routes', () => {
  it('guards owner settings routes behind authenticated matching', () => {
    const ownerSettingsRoute = routes.find((route) => route.path === 'owner/settings');
    const ownerBranchesRoute = routes.find((route) => route.path === 'owner/branches');

    expect(ownerSettingsRoute?.canMatch).toEqual([authCanMatch]);
    expect(ownerBranchesRoute?.canMatch).toEqual([authCanMatch]);
  });
});
