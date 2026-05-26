import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { BranchSettingsController } from '../../src/lib/controllers/branch-settings.controller';
import { BusinessSettingsController } from '../../src/lib/controllers/business-settings.controller';
import { ServiceCatalogController } from '../../src/lib/controllers/service-catalog.controller';
import { StaffController } from '../../src/lib/controllers/staff.controller';
import { SalonOwnerSettingsService } from '../../src/lib/services/salon-owner-settings.service';
import { StaffServiceCatalogService } from '../../src/lib/services/staff-service-catalog.service';

describe('Salon owner settings routes', () => {
  const branchId = '11111111-1111-4111-8111-111111111111';
  let app: INestApplication;
  const service = {
    createBusiness: jest.fn(),
    createBranch: jest.fn(),
    replaceBranchHours: jest.fn(),
  };
  const catalog = {
    createStaff: jest.fn(),
    createService: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [BusinessSettingsController, BranchSettingsController, StaffController, ServiceCatalogController],
      providers: [
        { provide: SalonOwnerSettingsService, useValue: service },
        { provide: StaffServiceCatalogService, useValue: catalog },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use((req: { user?: unknown }, _res: unknown, next: () => void) => {
      req.user = {
        id: 'user-1',
        email: 'owner@example.com',
        roles: [],
        tenantId: 'tenant-1',
      };
      next();
    });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates create business payloads before invoking the service', async () => {
    await request(app.getHttpServer()).post('/partner/businesses').send({ displayName: 'A' }).expect(400);
    expect(service.createBusiness).not.toHaveBeenCalled();
  });

  it('requires an idempotency key for create business requests', async () => {
    await request(app.getHttpServer())
      .post('/partner/businesses')
      .send({ displayName: 'Salon One', legalName: 'Salon One Legal', status: 'ACTIVE' })
      .expect(400);

    expect(service.createBusiness).not.toHaveBeenCalled();
  });

  it('accepts create business requests when the idempotency key is present', async () => {
    service.createBusiness.mockResolvedValue({
      id: 'business-1',
      tenantId: 'tenant-1',
      displayName: 'Salon One',
      legalName: 'Salon One Legal',
      status: 'ACTIVE',
      createdAt: '2026-05-26T00:00:00.000Z',
      updatedAt: '2026-05-26T00:00:00.000Z',
    });

    await request(app.getHttpServer())
      .post('/partner/businesses')
      .set('Idempotency-Key', 'key-12345')
      .send({ displayName: 'Salon One', legalName: 'Salon One Legal', status: 'ACTIVE' })
      .expect(201);

    expect(service.createBusiness).toHaveBeenCalledWith(
      { user: expect.objectContaining({ tenantId: 'tenant-1' }), idempotencyKey: 'key-12345' },
      expect.objectContaining({ displayName: 'Salon One' }),
    );
  });

  it('requires an idempotency key for create branch requests', async () => {
    await request(app.getHttpServer())
      .post('/partner/branches')
      .send({
        businessId: '11111111-1111-4111-8111-111111111112',
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
      })
      .expect(400);

    expect(service.createBranch).not.toHaveBeenCalled();
  });

  it('accepts create branch requests when the idempotency key is present', async () => {
    service.createBranch.mockResolvedValue({
      id: branchId,
      businessId: '11111111-1111-4111-8111-111111111112',
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
      createdAt: '2026-05-26T00:00:00.000Z',
      updatedAt: '2026-05-26T00:00:00.000Z',
    });

    await request(app.getHttpServer())
      .post('/partner/branches')
      .set('Idempotency-Key', 'key-23456')
      .send({
        businessId: '11111111-1111-4111-8111-111111111112',
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
      })
      .expect(201);

    expect(service.createBranch).toHaveBeenCalledWith(
      { user: expect.objectContaining({ tenantId: 'tenant-1' }), idempotencyKey: 'key-23456' },
      expect.objectContaining({ name: 'Main Branch' }),
    );
  });

  it('routes valid branch hours requests to the feature service', async () => {
    service.replaceBranchHours.mockResolvedValue({ branchId, timezone: 'Asia/Tokyo', days: [] });

    await request(app.getHttpServer())
      .put(`/partner/branches/${branchId}/hours`)
      .send({
        timezone: 'Asia/Tokyo',
        days: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
          dayOfWeek,
          open: false,
          intervals: [],
        })),
      })
      .expect(200);

    expect(service.replaceBranchHours).toHaveBeenCalledWith(
      { user: expect.objectContaining({ tenantId: 'tenant-1' }) },
      branchId,
      expect.objectContaining({ timezone: 'Asia/Tokyo' }),
    );
  });

  it('validates staff payloads before invoking the catalog service', async () => {
    await request(app.getHttpServer()).post('/partner/staff').send({ branchIds: [], displayName: 'A' }).expect(400);
    expect(catalog.createStaff).not.toHaveBeenCalled();
  });

  it('routes valid service catalog requests to the catalog service', async () => {
    catalog.createService.mockResolvedValue({ id: 'service-1' });

    await request(app.getHttpServer())
      .post('/partner/services')
      .send({
        categoryId: '00000000-0000-4000-8000-000000000001',
        name: 'Cut',
        durationMinutes: 45,
        bufferMinutes: 5,
        basePrice: '35.00',
        taxRatePercent: '10.00',
        status: 'ACTIVE',
      })
      .expect(201);

    expect(catalog.createService).toHaveBeenCalledWith(
      { user: expect.objectContaining({ tenantId: 'tenant-1' }) },
      expect.objectContaining({ name: 'Cut', categoryId: '00000000-0000-4000-8000-000000000001' }),
    );
  });
});
