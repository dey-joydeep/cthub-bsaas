import { INTERCEPTORS_METADATA } from '@nestjs/common/constants';
import { ResponseEnvelopeInterceptor } from '@cthub-bsaas/server-core';
import type { AuthenticatedUser } from '@cthub-bsaas/shared';

import { PermissionsController } from './permissions.controller';
import { RolesController } from './roles.controller';
import { ServiceCatalogController } from './service-catalog.controller';
import { StaffController } from './staff.controller';
import type { ServiceCatalogService } from '../services/service-catalog.service';
import type { StaffService } from '../services/staff.service';

const user: AuthenticatedUser = {
  id: 'user-1',
  email: 'owner@example.com',
  roles: [],
  tenantId: 'tenant-1',
};

function staffServiceMock() {
  return {
    listStaff: jest.fn(),
    createStaff: jest.fn(),
    getStaff: jest.fn(),
    updateStaff: jest.fn(),
    replaceStaffRoles: jest.fn(),
    replaceStaffSkills: jest.fn(),
    getStaffShifts: jest.fn(),
    replaceStaffShifts: jest.fn(),
    listStaffLeaveBlocks: jest.fn(),
    createStaffLeaveBlock: jest.fn(),
    deleteStaffLeaveBlock: jest.fn(),
    getStaffPersonalDetails: jest.fn(),
    updateStaffPersonalDetails: jest.fn(),
    selfUpdateStaffContact: jest.fn(),
    uploadStaffIdentityDocument: jest.fn(),
    listStaffIdentityDocuments: jest.fn(),
    verifyStaffIdentityDocument: jest.fn(),
    listBusinessRoles: jest.fn(),
    createBusinessRole: jest.fn(),
    updateBusinessRole: jest.fn(),
    deleteBusinessRole: jest.fn(),
    listSystemPermissions: jest.fn(),
  };
}

function serviceCatalogMock() {
  return {
    listServiceCategories: jest.fn(),
    createServiceCategory: jest.fn(),
    listServices: jest.fn(),
    createService: jest.fn(),
    getService: jest.fn(),
    updateService: jest.fn(),
    updateServiceStatus: jest.fn(),
    replaceServiceStaffEligibility: jest.fn(),
    updateBranchServiceOverride: jest.fn(),
  };
}

describe('Staff and service catalog controllers', () => {
  it('wraps staff and service catalog responses in the API envelope', () => {
    expect(Reflect.getMetadata(INTERCEPTORS_METADATA, StaffController)).toContain(ResponseEnvelopeInterceptor);
    expect(Reflect.getMetadata(INTERCEPTORS_METADATA, ServiceCatalogController)).toContain(ResponseEnvelopeInterceptor);
    expect(Reflect.getMetadata(INTERCEPTORS_METADATA, RolesController)).toContain(ResponseEnvelopeInterceptor);
    expect(Reflect.getMetadata(INTERCEPTORS_METADATA, PermissionsController)).toContain(ResponseEnvelopeInterceptor);
  });

  it('delegates staff routes with route parameters and authenticated context', async () => {
    const service = staffServiceMock();
    const controller = new StaffController(service as unknown as StaffService);
    const query = { branchId: 'branch-1', q: 'ann', page: 2, pageSize: 25 };
    const staff = { branchIds: ['branch-1'], displayName: 'Stylist One', phone: '09000000001', status: 'ACTIVE' as const };
    const shift = { branchId: 'branch-1', timezone: 'Asia/Tokyo', days: [] };
    const leave = {
      branchId: 'branch-1',
      startsAt: '2026-05-26T01:00:00.000Z',
      endsAt: '2026-05-26T02:00:00.000Z',
      reason: 'Personal',
    };

    const leaveQuery = { from: '2026-05-01T00:00:00.000Z', to: '2026-05-31T23:59:59.000Z' };
    const selfContact = { phone: '09000000002', emergencyContact: { name: 'Emergency Contact', phone: '09099990000' } };
    const personalDetails = {
      legalName: 'Legal Name',
      dateOfBirth: '1990-01-01',
      employmentType: 'FULL_TIME' as const,
      hireDate: '2022-01-01',
      payoutMethod: 'CASH' as const,
    };
    const documentInput = {
      documentType: 'DRIVERS_LICENSE' as const,
      fileKey: 'key-1',
      mimeType: 'image/jpeg',
      fileSizeBytes: 1024,
    };
    const verifyInput = {
      verificationStatus: 'VERIFIED' as const,
    };

    await controller.listStaff(user, query);
    await controller.createStaff(user, staff);
    await controller.getStaff(user, '11111111-1111-4111-8111-111111111111');
    await controller.updateStaff(user, '11111111-1111-4111-8111-111111111111', staff);
    await controller.replaceStaffRoles(user, '11111111-1111-4111-8111-111111111111', { roles: ['STYLIST'] });
    await controller.replaceStaffSkills(user, '11111111-1111-4111-8111-111111111111', { serviceIds: ['service-1'] });
    await controller.getStaffShifts(user, '11111111-1111-4111-8111-111111111111');
    await controller.replaceStaffShifts(user, '11111111-1111-4111-8111-111111111111', shift);
    await controller.listStaffLeaveBlocks(user, '11111111-1111-4111-8111-111111111111', leaveQuery);
    await controller.createStaffLeaveBlock(user, '11111111-1111-4111-8111-111111111111', leave);
    await controller.deleteStaffLeaveBlock(user, '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222');
    await controller.selfUpdateStaffContact(user, selfContact);
    await controller.selfUpdateStaffContactScoped(user, '11111111-1111-4111-8111-111111111111', selfContact);
    await controller.getStaffPersonalDetails(user, '11111111-1111-4111-8111-111111111111');
    await controller.getStaffPersonalProfile(user, '11111111-1111-4111-8111-111111111111');
    await controller.updateStaffPersonalDetails(user, '11111111-1111-4111-8111-111111111111', personalDetails);
    await controller.updateStaffPersonalProfile(user, '11111111-1111-4111-8111-111111111111', personalDetails);
    await controller.listStaffIdentityDocuments(user, '11111111-1111-4111-8111-111111111111');
    await controller.uploadStaffIdentityDocument(user, '11111111-1111-4111-8111-111111111111', documentInput);
    await controller.verifyStaffIdentityDocument(
      user,
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
      verifyInput,
    );

    expect(service.listStaff).toHaveBeenCalledWith({ user }, query);
    expect(service.createStaff).toHaveBeenCalledWith({ user }, staff);
    expect(service.getStaff).toHaveBeenCalledWith({ user }, '11111111-1111-4111-8111-111111111111');
    expect(service.updateStaff).toHaveBeenCalledWith({ user }, '11111111-1111-4111-8111-111111111111', staff);
    expect(service.replaceStaffRoles).toHaveBeenCalledWith({ user }, '11111111-1111-4111-8111-111111111111', { roles: ['STYLIST'] });
    expect(service.replaceStaffSkills).toHaveBeenCalledWith({ user }, '11111111-1111-4111-8111-111111111111', {
      serviceIds: ['service-1'],
    });
    expect(service.getStaffShifts).toHaveBeenCalledWith({ user }, '11111111-1111-4111-8111-111111111111');
    expect(service.replaceStaffShifts).toHaveBeenCalledWith({ user }, '11111111-1111-4111-8111-111111111111', shift);
    expect(service.listStaffLeaveBlocks).toHaveBeenCalledWith({ user }, '11111111-1111-4111-8111-111111111111', leaveQuery);
    expect(service.createStaffLeaveBlock).toHaveBeenCalledWith({ user }, '11111111-1111-4111-8111-111111111111', leave);
    expect(service.deleteStaffLeaveBlock).toHaveBeenCalledWith(
      { user },
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
    );
    expect(service.selfUpdateStaffContact).toHaveBeenCalledWith({ user }, selfContact);
    expect(service.getStaffPersonalDetails).toHaveBeenCalledWith({ user }, '11111111-1111-4111-8111-111111111111');
    expect(service.updateStaffPersonalDetails).toHaveBeenCalledWith({ user }, '11111111-1111-4111-8111-111111111111', personalDetails);
    expect(service.listStaffIdentityDocuments).toHaveBeenCalledWith({ user }, '11111111-1111-4111-8111-111111111111');
    expect(service.uploadStaffIdentityDocument).toHaveBeenCalledWith({ user }, '11111111-1111-4111-8111-111111111111', documentInput);
    expect(service.verifyStaffIdentityDocument).toHaveBeenCalledWith(
      { user },
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
      verifyInput,
    );
  });

  it('delegates service catalog routes with route parameters and authenticated context', async () => {
    const service = serviceCatalogMock();
    const controller = new ServiceCatalogController(service as unknown as ServiceCatalogService);
    const category = { name: 'Hair', sortOrder: 1 };
    const serviceInput = {
      categoryId: 'category-1',
      name: 'Cut',
      durationMinutes: 45,
      basePrice: '35.00',
      taxRatePercent: '10.00',
      status: 'ACTIVE' as const,
    };
    const overrideInput = {
      priceOverride: '40.00',
      durationOverrideMinutes: 50,
      visibleOnline: true,
      isActive: true,
    };

    await controller.listServiceCategories(user, 'business-1');
    await controller.createServiceCategory(user, category);
    await controller.listServices(user, 'category-1', 'business-1');
    await controller.createService(user, serviceInput);
    await controller.getService(user, 'service-1');
    await controller.updateService(user, 'service-1', serviceInput);
    await controller.updateServiceStatus(user, 'service-1', { status: 'INACTIVE' });
    await controller.replaceServiceStaffEligibility(user, 'service-1', { staffIds: ['staff-1'] });
    await controller.updateBranchServiceOverride(user, 'service-1', 'branch-1', overrideInput);

    expect(service.listServiceCategories).toHaveBeenCalledWith({ user }, 'business-1');
    expect(service.createServiceCategory).toHaveBeenCalledWith({ user }, category);
    expect(service.listServices).toHaveBeenCalledWith({ user }, { categoryId: 'category-1', businessId: 'business-1' });
    expect(service.createService).toHaveBeenCalledWith({ user }, serviceInput);
    expect(service.getService).toHaveBeenCalledWith({ user }, 'service-1');
    expect(service.updateService).toHaveBeenCalledWith({ user }, 'service-1', serviceInput);
    expect(service.updateServiceStatus).toHaveBeenCalledWith({ user }, 'service-1', { status: 'INACTIVE' });
    expect(service.replaceServiceStaffEligibility).toHaveBeenCalledWith({ user }, 'service-1', { staffIds: ['staff-1'] });
    expect(service.updateBranchServiceOverride).toHaveBeenCalledWith({ user }, 'service-1', 'branch-1', overrideInput);
  });

  it('delegates roles routes with route parameters and authenticated context', async () => {
    const service = staffServiceMock();
    const controller = new RolesController(service as unknown as StaffService);
    const query = { includeInactive: true };
    const roleInput = {
      name: 'Senior Stylist',
      description: 'Experienced stylist',
      permissions: ['appointment.create', 'appointment.view'],
      isActive: true,
    };

    await controller.listBusinessRoles(user, query);
    await controller.createBusinessRole(user, roleInput);
    await controller.updateBusinessRole(user, '11111111-1111-4111-8111-111111111111', roleInput);
    await controller.deleteBusinessRole(user, '11111111-1111-4111-8111-111111111111');

    expect(service.listBusinessRoles).toHaveBeenCalledWith({ user }, query);
    expect(service.createBusinessRole).toHaveBeenCalledWith({ user }, roleInput);
    expect(service.updateBusinessRole).toHaveBeenCalledWith({ user }, '11111111-1111-4111-8111-111111111111', roleInput);
    expect(service.deleteBusinessRole).toHaveBeenCalledWith({ user }, '11111111-1111-4111-8111-111111111111');
  });

  it('delegates permissions routes', async () => {
    const service = staffServiceMock();
    const controller = new PermissionsController(service as unknown as StaffService);

    await controller.listSystemPermissions();

    expect(service.listSystemPermissions).toHaveBeenCalled();
  });
});
