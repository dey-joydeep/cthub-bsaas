import { INTERCEPTORS_METADATA } from '@nestjs/common/constants';
import { BadRequestException } from '@nestjs/common';
import { ResponseEnvelopeInterceptor, ROLES_KEY } from '@cthub-bsaas/server-core';
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
    getBranchHours: jest.fn(),
    listBranchHolidays: jest.fn(),
    getBranchPolicy: jest.fn(),
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

  it('wraps settings controller responses in the API envelope', () => {
    expect(Reflect.getMetadata(INTERCEPTORS_METADATA, BusinessSettingsController)).toContain(ResponseEnvelopeInterceptor);
    expect(Reflect.getMetadata(INTERCEPTORS_METADATA, BranchSettingsController)).toContain(ResponseEnvelopeInterceptor);
  });

  it('delegates business routes to the service with authenticated context', async () => {
    const service = serviceMock();
    const controller = new BusinessSettingsController(service as unknown as SalonOwnerSettingsService);
    const body = { displayName: 'Salon One', legalName: 'Salon One Legal', status: 'ACTIVE' as const };

    await controller.listBusinesses(user, 2, 10);
    await controller.createBusiness(user, 'key-12345', body);
    await controller.getBusiness(user, 'business-1');
    await controller.updateBusiness(user, 'business-1', body);

    expect(service.listBusinesses).toHaveBeenCalledWith({ user }, { page: 2, pageSize: 10 });
    expect(service.createBusiness).toHaveBeenCalledWith({ user, idempotencyKey: 'key-12345' }, body);
    expect(service.getBusiness).toHaveBeenCalledWith({ user }, 'business-1');
    expect(service.updateBusiness).toHaveBeenCalledWith({ user }, 'business-1', body);
  });

  it('rejects business creation when the idempotency key is missing', () => {
    const controller = new BusinessSettingsController(serviceMock() as unknown as SalonOwnerSettingsService);

    expect(() =>
      controller.createBusiness(user, '   ', { displayName: 'Salon One', legalName: 'Salon One Legal', status: 'ACTIVE' }),
    ).toThrow(BadRequestException);
  });

  it('rejects business creation when the idempotency key falls outside the documented bounds', () => {
    const controller = new BusinessSettingsController(serviceMock() as unknown as SalonOwnerSettingsService);

    expect(() =>
      controller.createBusiness(user, 'short', { displayName: 'Salon One', legalName: 'Salon One Legal', status: 'ACTIVE' }),
    ).toThrow(BadRequestException);
    expect(() =>
      controller.createBusiness(user, 'x'.repeat(129), {
        displayName: 'Salon One',
        legalName: 'Salon One Legal',
        status: 'ACTIVE',
      }),
    ).toThrow(BadRequestException);
  });

  it('delegates branch routes to the service with route parameters', async () => {
    const service = serviceMock();
    const controller = new BranchSettingsController(service as unknown as SalonOwnerSettingsService);
    const profile = {
      businessId: 'business-1',
      name: 'Main Branch',
      timezone: 'Asia/Tokyo',
      currency: 'JPY',
      status: 'ACTIVE' as const,
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

    await controller.listBranches(user, 'business-1', 'ACTIVE', 'downtown', 3, 5);
    await controller.createBranch(user, 'key-23456', profile);
    await controller.getBranch(user, 'branch-1');
    await controller.getBranchHours(user, 'branch-1');
    await controller.listBranchHolidays(user, 'branch-1');
    await controller.getBranchPolicy(user, 'branch-1');
    await controller.updateBranch(user, 'branch-1', profile);
    await controller.replaceBranchHours(user, 'branch-1', hours);
    await controller.setBranchHoliday(user, 'branch-1', '2026-05-26', holiday);
    await controller.updateBranchPolicy(user, 'branch-1', policy);

    expect(service.listBranches).toHaveBeenCalledWith(
      { user },
      'business-1',
      { status: 'ACTIVE', q: 'downtown' },
      { page: 3, pageSize: 5 },
    );
    expect(service.createBranch).toHaveBeenCalledWith({ user, idempotencyKey: 'key-23456' }, profile);
    expect(service.getBranch).toHaveBeenCalledWith({ user }, 'branch-1');
    expect(service.getBranchHours).toHaveBeenCalledWith({ user }, 'branch-1');
    expect(service.listBranchHolidays).toHaveBeenCalledWith({ user }, 'branch-1');
    expect(service.getBranchPolicy).toHaveBeenCalledWith({ user }, 'branch-1');
    expect(service.updateBranch).toHaveBeenCalledWith({ user }, 'branch-1', profile);
    expect(service.replaceBranchHours).toHaveBeenCalledWith({ user }, 'branch-1', hours);
    expect(service.setBranchHoliday).toHaveBeenCalledWith({ user }, 'branch-1', '2026-05-26', holiday);
    expect(service.updateBranchPolicy).toHaveBeenCalledWith({ user }, 'branch-1', policy);
  });

  it('rejects branch creation when the idempotency key is missing', () => {
    const controller = new BranchSettingsController(serviceMock() as unknown as SalonOwnerSettingsService);

    expect(() =>
      controller.createBranch(user, undefined, {
        businessId: 'business-1',
        name: 'Main Branch',
        timezone: 'Asia/Tokyo',
        currency: 'JPY',
        status: 'ACTIVE',
        address: {
          line1: '1 Main St',
          city: 'Tokyo',
          state: 'Tokyo',
          postalCode: '1000001',
          country: 'JP',
        },
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects branch creation when the idempotency key falls outside the documented bounds', () => {
    const controller = new BranchSettingsController(serviceMock() as unknown as SalonOwnerSettingsService);
    const body = {
      businessId: 'business-1',
      name: 'Main Branch',
      timezone: 'Asia/Tokyo',
      currency: 'JPY',
      status: 'ACTIVE' as const,
      address: {
        line1: '1 Main St',
        city: 'Tokyo',
        state: 'Tokyo',
        postalCode: '1000001',
        country: 'JP',
      },
    };

    expect(() => controller.createBranch(user, 'short', body)).toThrow(BadRequestException);
    expect(() => controller.createBranch(user, 'x'.repeat(129), body)).toThrow(BadRequestException);
  });

  it('rejects invalid branch status filters before calling the service', () => {
    const service = serviceMock();
    const controller = new BranchSettingsController(service as unknown as SalonOwnerSettingsService);

    expect(() => controller.listBranches(user, 'business-1', 'BROKEN', 'downtown', 1, 10)).toThrow(BadRequestException);
    expect(service.listBranches).not.toHaveBeenCalled();
  });

  it('rejects repeated branch search query values before calling the service', () => {
    const service = serviceMock();
    const controller = new BranchSettingsController(service as unknown as SalonOwnerSettingsService);

    expect(() => controller.listBranches(user, 'business-1', 'ACTIVE', ['downtown', 'midtown'], 1, 10)).toThrow(BadRequestException);
    expect(service.listBranches).not.toHaveBeenCalled();
  });

  it('passes an omitted branch status filter through as undefined', async () => {
    const service = serviceMock();
    const controller = new BranchSettingsController(service as unknown as SalonOwnerSettingsService);

    await controller.listBranches(user, 'business-1', undefined, 'downtown', 1, 10);

    expect(service.listBranches).toHaveBeenCalledWith(
      { user },
      'business-1',
      { status: undefined, q: 'downtown' },
      { page: 1, pageSize: 10 },
    );
  });
});
