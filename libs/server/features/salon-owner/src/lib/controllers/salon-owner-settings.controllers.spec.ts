import { ROLES_KEY } from '@cthub-bsaas/server-core';
import { UserRole, type AuthenticatedUser } from '@cthub-bsaas/shared';

import { BranchSettingsController } from './branch-settings.controller';
import { BusinessSettingsController } from './business-settings.controller';
import type { SalonOwnerSettingsService } from '../services/salon-owner-settings.service';

const user: AuthenticatedUser = {
  id: 'user-1',
  email: 'owner@example.com',
  roles: [],
  tenantId: 'tenant-1',
};

function serviceMock() {
  return {
    listBusinesses: jest.fn(),
    createBusiness: jest.fn(),
    getBusiness: jest.fn(),
    updateBusiness: jest.fn(),
    listBranches: jest.fn(),
    createBranch: jest.fn(),
    getBranch: jest.fn(),
    updateBranch: jest.fn(),
    replaceBranchHours: jest.fn(),
    setBranchHoliday: jest.fn(),
    updateBranchPolicy: jest.fn(),
  };
}

describe('Salon owner settings controllers', () => {
  it('restricts settings controllers to owner and admin roles', () => {
    expect(Reflect.getMetadata(ROLES_KEY, BusinessSettingsController)).toEqual([UserRole.OWNER, UserRole.ADMIN]);
    expect(Reflect.getMetadata(ROLES_KEY, BranchSettingsController)).toEqual([UserRole.OWNER, UserRole.ADMIN]);
  });

  it('delegates business routes to the service with authenticated context', async () => {
    const service = serviceMock();
    const controller = new BusinessSettingsController(service as unknown as SalonOwnerSettingsService);
    const body = { displayName: 'Salon One', legalName: 'Salon One Legal', status: 'ACTIVE' as const };

    await controller.listBusinesses(user);
    await controller.createBusiness(user, body);
    await controller.getBusiness(user, 'business-1');
    await controller.updateBusiness(user, 'business-1', body);

    expect(service.listBusinesses).toHaveBeenCalledWith({ user });
    expect(service.createBusiness).toHaveBeenCalledWith({ user }, body);
    expect(service.getBusiness).toHaveBeenCalledWith({ user }, 'business-1');
    expect(service.updateBusiness).toHaveBeenCalledWith({ user }, 'business-1', body);
  });

  it('delegates branch routes to the service with route parameters', async () => {
    const service = serviceMock();
    const controller = new BranchSettingsController(service as unknown as SalonOwnerSettingsService);
    const profile = {
      businessId: 'business-1',
      name: 'Main Branch',
      timezone: 'Asia/Tokyo',
      currency: 'JPY',
      address: {
        line1: '1 Main St',
        city: 'Tokyo',
        state: 'Tokyo',
        postalCode: '1000001',
        country: 'JP',
      },
    };
    const hours = {
      timezone: 'Asia/Tokyo',
      days: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
        dayOfWeek,
        open: false,
        intervals: [],
      })),
    };
    const holiday = { closed: true };
    const policy = { bookingLeadMinutes: 30, cancellationCutoffMinutes: 120, noShowGraceMinutes: 10 };

    await controller.listBranches(user, 'business-1');
    await controller.createBranch(user, profile);
    await controller.getBranch(user, 'branch-1');
    await controller.updateBranch(user, 'branch-1', profile);
    await controller.replaceBranchHours(user, 'branch-1', hours);
    await controller.setBranchHoliday(user, 'branch-1', '2026-05-26', holiday);
    await controller.updateBranchPolicy(user, 'branch-1', policy);

    expect(service.listBranches).toHaveBeenCalledWith({ user }, 'business-1');
    expect(service.createBranch).toHaveBeenCalledWith({ user }, profile);
    expect(service.getBranch).toHaveBeenCalledWith({ user }, 'branch-1');
    expect(service.updateBranch).toHaveBeenCalledWith({ user }, 'branch-1', profile);
    expect(service.replaceBranchHours).toHaveBeenCalledWith({ user }, 'branch-1', hours);
    expect(service.setBranchHoliday).toHaveBeenCalledWith({ user }, 'branch-1', '2026-05-26', holiday);
    expect(service.updateBranchPolicy).toHaveBeenCalledWith({ user }, 'branch-1', policy);
  });
});
