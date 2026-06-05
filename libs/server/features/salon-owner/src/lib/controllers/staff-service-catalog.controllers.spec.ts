import { INTERCEPTORS_METADATA } from '@nestjs/common/constants';
import { ResponseEnvelopeInterceptor } from '@cthub-bsaas/server-core';
import type { AuthenticatedUser } from '@cthub-bsaas/shared';

import { ServiceCatalogController } from './service-catalog.controller';
import { StaffController } from './staff.controller';
import type { StaffServiceCatalogService } from '../services/staff-service-catalog.service';

const user: AuthenticatedUser = {
  id: 'user-1',
  email: 'owner@example.com',
  roles: [],
  tenantId: 'tenant-1',
};

function serviceMock() {
  return {
    listStaff: jest.fn(),
    createStaff: jest.fn(),
    getStaff: jest.fn(),
    updateStaff: jest.fn(),
    replaceStaffRoles: jest.fn(),
    replaceStaffSkills: jest.fn(),
    replaceStaffShifts: jest.fn(),
    createStaffLeaveBlock: jest.fn(),
    listServiceCategories: jest.fn(),
    createServiceCategory: jest.fn(),
    listServices: jest.fn(),
    createService: jest.fn(),
    getService: jest.fn(),
    updateService: jest.fn(),
    updateServiceStatus: jest.fn(),
    replaceServiceStaffEligibility: jest.fn(),
  };
}

describe('Staff and service catalog controllers', () => {
  it('wraps staff and service catalog responses in the API envelope', () => {
    expect(Reflect.getMetadata(INTERCEPTORS_METADATA, StaffController)).toContain(ResponseEnvelopeInterceptor);
    expect(Reflect.getMetadata(INTERCEPTORS_METADATA, ServiceCatalogController)).toContain(ResponseEnvelopeInterceptor);
  });

  it('delegates staff routes with route parameters and authenticated context', async () => {
    const service = serviceMock();
    const controller = new StaffController(service as unknown as StaffServiceCatalogService);
    const query = { branchId: 'branch-1', q: 'ann', page: 2, pageSize: 25 };
    const staff = { branchIds: ['branch-1'], displayName: 'Stylist One', phone: '09000000001', status: 'ACTIVE' as const };
    const shift = { branchId: 'branch-1', timezone: 'Asia/Tokyo', days: [] };
    const leave = {
      branchId: 'branch-1',
      startsAt: '2026-05-26T01:00:00.000Z',
      endsAt: '2026-05-26T02:00:00.000Z',
      reason: 'Personal',
    };

    await controller.listStaff(user, query);
    await controller.createStaff(user, staff);
    await controller.getStaff(user, 'staff-1');
    await controller.updateStaff(user, 'staff-1', staff);
    await controller.replaceStaffRoles(user, 'staff-1', { roles: ['STYLIST'] });
    await controller.replaceStaffSkills(user, 'staff-1', { serviceIds: ['service-1'] });
    await controller.replaceStaffShifts(user, 'staff-1', shift);
    await controller.createStaffLeaveBlock(user, 'staff-1', leave);

    expect(service.listStaff).toHaveBeenCalledWith({ user }, query);
    expect(service.createStaff).toHaveBeenCalledWith({ user }, staff);
    expect(service.getStaff).toHaveBeenCalledWith({ user }, 'staff-1');
    expect(service.updateStaff).toHaveBeenCalledWith({ user }, 'staff-1', staff);
    expect(service.replaceStaffRoles).toHaveBeenCalledWith({ user }, 'staff-1', { roles: ['STYLIST'] });
    expect(service.replaceStaffSkills).toHaveBeenCalledWith({ user }, 'staff-1', { serviceIds: ['service-1'] });
    expect(service.replaceStaffShifts).toHaveBeenCalledWith({ user }, 'staff-1', shift);
    expect(service.createStaffLeaveBlock).toHaveBeenCalledWith({ user }, 'staff-1', leave);
  });

  it('delegates service catalog routes with route parameters and authenticated context', async () => {
    const service = serviceMock();
    const controller = new ServiceCatalogController(service as unknown as StaffServiceCatalogService);
    const category = { name: 'Hair', sortOrder: 1 };
    const serviceInput = {
      categoryId: 'category-1',
      name: 'Cut',
      durationMinutes: 45,
      basePrice: '35.00',
      taxRatePercent: '10.00',
      status: 'ACTIVE' as const,
    };

    await controller.listServiceCategories(user, 'business-1');
    await controller.createServiceCategory(user, category);
    await controller.listServices(user, 'category-1', 'business-1');
    await controller.createService(user, serviceInput);
    await controller.getService(user, 'service-1');
    await controller.updateService(user, 'service-1', serviceInput);
    await controller.updateServiceStatus(user, 'service-1', { status: 'INACTIVE' });
    await controller.replaceServiceStaffEligibility(user, 'service-1', { staffIds: ['staff-1'] });

    expect(service.listServiceCategories).toHaveBeenCalledWith({ user }, 'business-1');
    expect(service.createServiceCategory).toHaveBeenCalledWith({ user }, category);
    expect(service.listServices).toHaveBeenCalledWith({ user }, { categoryId: 'category-1', businessId: 'business-1' });
    expect(service.createService).toHaveBeenCalledWith({ user }, serviceInput);
    expect(service.getService).toHaveBeenCalledWith({ user }, 'service-1');
    expect(service.updateService).toHaveBeenCalledWith({ user }, 'service-1', serviceInput);
    expect(service.updateServiceStatus).toHaveBeenCalledWith({ user }, 'service-1', { status: 'INACTIVE' });
    expect(service.replaceServiceStaffEligibility).toHaveBeenCalledWith({ user }, 'service-1', { staffIds: ['staff-1'] });
  });
});
