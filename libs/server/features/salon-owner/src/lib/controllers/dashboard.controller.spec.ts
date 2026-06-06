import type { AuthenticatedUser } from '@cthub-bsaas/shared';

import { DashboardController } from './dashboard.controller';
import type { DashboardQueryService } from '../services/dashboard-query.service';

const user: AuthenticatedUser = { id: 'user-1', email: 'owner@example.com', roles: [], tenantId: 'tenant-1' };

function serviceMock() {
  return {
    getOwnerDashboard: jest.fn(),
    listDashboardAlerts: jest.fn(),
  };
}

describe('DashboardController', () => {
  it('delegates dashboard routes to the query service with authenticated context', async () => {
    const service = serviceMock();
    const controller = new DashboardController(service as unknown as DashboardQueryService);

    await controller.getOwnerDashboard(user, 'branch-1', '2026-05-26');
    await controller.listDashboardAlerts(user, 'branch-1');

    expect(service.getOwnerDashboard).toHaveBeenCalledWith({ user }, 'branch-1', '2026-05-26');
    expect(service.listDashboardAlerts).toHaveBeenCalledWith({ user }, 'branch-1');
  });
});
