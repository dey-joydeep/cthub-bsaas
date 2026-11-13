import { ForbiddenException, INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { BranchSettingsController } from '../../src/lib/controllers/branch-settings.controller';
import { BusinessSettingsController } from '../../src/lib/controllers/business-settings.controller';
import { CustomerCrmController } from '../../src/lib/controllers/customer-crm.controller';
import { PermissionsController } from '../../src/lib/controllers/permissions.controller';
import { RolesController } from '../../src/lib/controllers/roles.controller';
import { ServiceCatalogController } from '../../src/lib/controllers/service-catalog.controller';
import { StaffController } from '../../src/lib/controllers/staff.controller';
import { CustomerCrmService } from '../../src/lib/services/customer-crm.service';
import { SalonOwnerSettingsService } from '../../src/lib/services/salon-owner-settings.service';
import { ServiceCatalogService } from '../../src/lib/services/service-catalog.service';
import { StaffService } from '../../src/lib/services/staff.service';

describe('Salon owner settings routes', () => {
  const branchId = '11111111-1111-4111-8111-111111111111';
  let app: INestApplication;
  const service = {
    createBusiness: jest.fn(),
    createBranch: jest.fn(),
    replaceBranchHours: jest.fn(),
  };
  const catalog = {
    listStaff: jest.fn(),
    createStaff: jest.fn(),
    createService: jest.fn(),
    listBusinessRoles: jest.fn(),
    createBusinessRole: jest.fn(),
    updateBusinessRole: jest.fn(),
    deleteBusinessRole: jest.fn(),
    listSystemPermissions: jest.fn(),
    getStaffPersonalDetails: jest.fn(),
    updateStaffPersonalDetails: jest.fn(),
    selfUpdateStaffContact: jest.fn(),
    listStaffIdentityDocuments: jest.fn(),
    uploadStaffIdentityDocument: jest.fn(),
    verifyStaffIdentityDocument: jest.fn(),
  };
  const customers = {
    createCustomer: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [
        BusinessSettingsController,
        BranchSettingsController,
        StaffController,
        RolesController,
        PermissionsController,
        ServiceCatalogController,
        CustomerCrmController,
      ],
      providers: [
        { provide: SalonOwnerSettingsService, useValue: service },
        { provide: StaffService, useValue: catalog },
        { provide: ServiceCatalogService, useValue: catalog },
        { provide: CustomerCrmService, useValue: customers },
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

  it('validates customer payloads before invoking the CRM service', async () => {
    await request(app.getHttpServer()).post('/partner/customers').send({ displayName: 'A' }).expect(400);
    expect(customers.createCustomer).not.toHaveBeenCalled();
  });

  it('routes valid customer requests to the CRM service', async () => {
    customers.createCustomer.mockResolvedValue({ id: 'customer-1' });

    await request(app.getHttpServer())
      .post('/partner/customers')
      .send({ displayName: 'Customer One', phone: '09000000001', consentForMarketing: true })
      .expect(201);

    expect(customers.createCustomer).toHaveBeenCalledWith(
      { user: expect.objectContaining({ tenantId: 'tenant-1' }) },
      expect.objectContaining({ displayName: 'Customer One' }),
    );
  });

  it('validates business role payloads before invoking catalog service', async () => {
    await request(app.getHttpServer()).post('/partner/roles').send({ name: 'A', permissions: [] }).expect(400);
    expect(catalog.createBusinessRole).not.toHaveBeenCalled();
  });

  it('routes valid business role and permission requests to catalog service', async () => {
    catalog.createBusinessRole.mockResolvedValue({ id: 'role-1' });
    catalog.listBusinessRoles.mockResolvedValue([{ id: 'role-1' }]);
    catalog.listSystemPermissions.mockResolvedValue([{ code: 'appointment.create' }]);

    await request(app.getHttpServer())
      .post('/partner/roles')
      .send({ name: 'Colorist', permissions: ['appointment.create'], isActive: true })
      .expect(201);

    expect(catalog.createBusinessRole).toHaveBeenCalledWith(
      { user: expect.objectContaining({ tenantId: 'tenant-1' }) },
      expect.objectContaining({ name: 'Colorist' }),
    );

    await request(app.getHttpServer()).get('/partner/roles').expect(200);
    expect(catalog.listBusinessRoles).toHaveBeenCalled();

    await request(app.getHttpServer()).get('/partner/permissions').expect(200);
    expect(catalog.listSystemPermissions).toHaveBeenCalled();
  });

  it('routes personal HR details, self contact, and identity document requests to catalog service', async () => {
    const staffId = '11111111-1111-4111-8111-111111111111';
    const docId = '22222222-2222-4222-8222-222222222222';
    catalog.getStaffPersonalDetails.mockResolvedValue({ staffId, employmentType: 'FULL_TIME' });
    catalog.updateStaffPersonalDetails.mockResolvedValue({ staffId, employmentType: 'FULL_TIME' });
    catalog.selfUpdateStaffContact.mockResolvedValue({ success: true });
    catalog.listStaffIdentityDocuments.mockResolvedValue([]);
    catalog.uploadStaffIdentityDocument.mockResolvedValue({ id: docId });
    catalog.verifyStaffIdentityDocument.mockResolvedValue({ id: docId, verificationStatus: 'VERIFIED' });

    await request(app.getHttpServer()).get(`/partner/staff/${staffId}/personal`).expect(200);
    expect(catalog.getStaffPersonalDetails).toHaveBeenCalled();

    await request(app.getHttpServer())
      .put(`/partner/staff/${staffId}/personal`)
      .send({ employmentType: 'FULL_TIME', hireDate: '2022-01-01', payoutMethod: 'CASH' })
      .expect(200);
    expect(catalog.updateStaffPersonalDetails).toHaveBeenCalled();

    await request(app.getHttpServer()).put('/partner/staff/self/contact').send({ phone: '09012345678' }).expect(200);
    expect(catalog.selfUpdateStaffContact).toHaveBeenCalled();

    await request(app.getHttpServer()).get(`/partner/staff/${staffId}/documents`).expect(200);
    expect(catalog.listStaffIdentityDocuments).toHaveBeenCalled();

    await request(app.getHttpServer())
      .post(`/partner/staff/${staffId}/documents`)
      .send({ documentType: 'DRIVERS_LICENSE', fileKey: 'tenants/test-file-key.jpg', mimeType: 'image/jpeg', fileSizeBytes: 1024 })
      .expect(201);
    expect(catalog.uploadStaffIdentityDocument).toHaveBeenCalled();

    await request(app.getHttpServer())
      .put(`/partner/staff/${staffId}/documents/${docId}/verify`)
      .send({ verificationStatus: 'VERIFIED' })
      .expect(200);
    expect(catalog.verifyStaffIdentityDocument).toHaveBeenCalled();
  });

  it('returns 403 Forbidden when a STYLIST role accesses staff personal details', async () => {
    const staffId = '11111111-1111-4111-8111-111111111111';
    catalog.getStaffPersonalDetails.mockRejectedValueOnce(new ForbiddenException('STAFF_UNAUTHORIZED_FIELD_ACCESS'));

    await request(app.getHttpServer()).get(`/partner/staff/${staffId}/personal`).expect(403);
    expect(catalog.getStaffPersonalDetails).toHaveBeenCalled();
  });

  it('allows OWNER role to retrieve and update residential address in personal profile', async () => {
    const staffId = '11111111-1111-4111-8111-111111111111';
    catalog.getStaffPersonalDetails.mockResolvedValueOnce({
      staffId,
      employmentType: 'FULL_TIME',
      hireDate: '2022-01-01',
      payoutMethod: 'BANK_TRANSFER',
      address: {
        line1: '1-2-3 Shibuya',
        city: 'Tokyo',
        state: 'Tokyo',
        postalCode: '150-0002',
        country: 'JP',
      },
    });

    const getRes = await request(app.getHttpServer()).get(`/partner/staff/${staffId}/personal`).expect(200);
    expect(getRes.body.data.address.line1).toBe('1-2-3 Shibuya');
    expect(getRes.body.data.address.postalCode).toBe('150-0002');

    catalog.updateStaffPersonalDetails.mockResolvedValueOnce({
      staffId,
      employmentType: 'FULL_TIME',
      hireDate: '2022-01-01',
      payoutMethod: 'CASH',
      address: {
        line1: '4-5-6 Harajuku',
        city: 'Tokyo',
        state: 'Tokyo',
        postalCode: '150-0001',
        country: 'JP',
      },
    });

    const putRes = await request(app.getHttpServer())
      .put(`/partner/staff/${staffId}/personal`)
      .send({
        employmentType: 'FULL_TIME',
        hireDate: '2022-01-01',
        payoutMethod: 'CASH',
        address: {
          line1: '4-5-6 Harajuku',
          city: 'Tokyo',
          state: 'Tokyo',
          postalCode: '150-0001',
          country: 'JP',
        },
      })
      .expect(200);
    expect(putRes.body.data.address.line1).toBe('4-5-6 Harajuku');
    expect(catalog.updateStaffPersonalDetails).toHaveBeenCalled();
  });

  it('does not leak addressLine1 or personal HR profile in GET /partner/staff', async () => {
    const staffId = '11111111-1111-4111-8111-111111111111';
    catalog.listStaff.mockResolvedValueOnce({
      items: [
        {
          id: staffId,
          displayName: 'Stylist Kenji',
          phone: '+81-90-1111-2222',
          email: 'kenji@example.com',
          status: 'ACTIVE',
          roles: ['STYLIST'],
          roleIds: [],
          branchIds: [branchId],
          skillServiceIds: [],
          createdAt: '2026-05-26T00:00:00.000Z',
          updatedAt: '2026-05-26T00:00:00.000Z',
        },
      ],
      page: { limit: 10, nextCursor: null, hasMore: false },
    });

    const res = await request(app.getHttpServer()).get('/partner/staff').expect(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].displayName).toBe('Stylist Kenji');
    expect(res.body.data.items[0].addressLine1).toBeUndefined();
    expect(res.body.data.items[0].address).toBeUndefined();
    expect(res.body.data.items[0].personalProfile).toBeUndefined();
  });

  it('supports PATCH /partner/staff/:staffId/personal/contact for self contact updates', async () => {
    const staffId = '11111111-1111-4111-8111-111111111111';
    catalog.selfUpdateStaffContact.mockResolvedValueOnce({ success: true });

    await request(app.getHttpServer()).patch(`/partner/staff/${staffId}/personal/contact`).send({ phone: '+81-90-5555-6666' }).expect(200);

    expect(catalog.selfUpdateStaffContact).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ phone: '+81-90-5555-6666' }),
      staffId,
    );
  });
});
