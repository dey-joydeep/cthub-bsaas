import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppointmentSchedulingController } from '../../src/lib/controllers/appointment-scheduling.controller';
import { BranchSettingsController } from '../../src/lib/controllers/branch-settings.controller';
import { BusinessSettingsController } from '../../src/lib/controllers/business-settings.controller';
import { CustomerCrmController } from '../../src/lib/controllers/customer-crm.controller';
import { DashboardController } from '../../src/lib/controllers/dashboard.controller';
import { InventoryController } from '../../src/lib/controllers/inventory.controller';
import { PosController } from '../../src/lib/controllers/pos.controller';
import { ServiceCatalogController } from '../../src/lib/controllers/service-catalog.controller';
import { StaffController } from '../../src/lib/controllers/staff.controller';
import { AppointmentSchedulingService } from '../../src/lib/services/appointment-scheduling.service';
import { CustomerCrmService } from '../../src/lib/services/customer-crm.service';
import { DashboardQueryService } from '../../src/lib/services/dashboard-query.service';
import { PosInventoryService } from '../../src/lib/services/pos-inventory.service';
import { SalonOwnerSettingsService } from '../../src/lib/services/salon-owner-settings.service';
import { StaffServiceCatalogService } from '../../src/lib/services/staff-service-catalog.service';

describe('Salon owner settings routes', () => {
  let app: INestApplication;
  const service = {
    createBusiness: jest.fn(),
    replaceBranchHours: jest.fn(),
  };
  const catalog = {
    createStaff: jest.fn(),
    createService: jest.fn(),
  };
  const customers = {
    createCustomer: jest.fn(),
  };
  const appointments = {
    createAppointment: jest.fn(),
  };
  const posInventory = {
    createInvoice: jest.fn(),
    createProduct: jest.fn(),
    createStockMovement: jest.fn(),
  };
  const dashboard = {
    getOwnerDashboard: jest.fn(),
    listDashboardAlerts: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [
        BusinessSettingsController,
        BranchSettingsController,
        StaffController,
        ServiceCatalogController,
        CustomerCrmController,
        AppointmentSchedulingController,
        PosController,
        InventoryController,
        DashboardController,
      ],
      providers: [
        { provide: SalonOwnerSettingsService, useValue: service },
        { provide: StaffServiceCatalogService, useValue: catalog },
        { provide: CustomerCrmService, useValue: customers },
        { provide: AppointmentSchedulingService, useValue: appointments },
        { provide: PosInventoryService, useValue: posInventory },
        { provide: DashboardQueryService, useValue: dashboard },
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

  it('routes valid branch hours requests to the feature service', async () => {
    service.replaceBranchHours.mockResolvedValue({ branchId: 'branch-1', timezone: 'Asia/Tokyo', days: [] });

    await request(app.getHttpServer())
      .put('/partner/branches/branch-1/hours')
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
      'branch-1',
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

  it('validates appointment payloads before invoking the scheduling service', async () => {
    await request(app.getHttpServer()).post('/partner/appointments').send({ branchId: 'bad' }).expect(400);
    expect(appointments.createAppointment).not.toHaveBeenCalled();
  });

  it('routes valid appointment requests to the scheduling service', async () => {
    appointments.createAppointment.mockResolvedValue({ id: 'appointment-1' });

    await request(app.getHttpServer())
      .post('/partner/appointments')
      .send({
        branchId: '00000000-0000-4000-8000-000000000001',
        customerId: '00000000-0000-4000-8000-000000000002',
        lines: [
          {
            serviceId: '00000000-0000-4000-8000-000000000003',
            staffId: '00000000-0000-4000-8000-000000000004',
            startsAt: '2026-05-26T09:00:00.000Z',
          },
        ],
      })
      .expect(201);

    expect(appointments.createAppointment).toHaveBeenCalledWith(
      { user: expect.objectContaining({ tenantId: 'tenant-1' }) },
      expect.objectContaining({ branchId: '00000000-0000-4000-8000-000000000001' }),
    );
  });

  it('validates POS invoice payloads before invoking the service', async () => {
    await request(app.getHttpServer()).post('/partner/pos/invoices').send({ branchId: 'bad', lines: [] }).expect(400);
    expect(posInventory.createInvoice).not.toHaveBeenCalled();
  });

  it('routes valid POS invoice requests to the feature service', async () => {
    posInventory.createInvoice.mockResolvedValue({ id: 'invoice-1' });

    await request(app.getHttpServer())
      .post('/partner/pos/invoices')
      .send({
        branchId: '00000000-0000-4000-8000-000000000001',
        customerId: '00000000-0000-4000-8000-000000000002',
        lines: [
          {
            type: 'SERVICE',
            referenceId: '00000000-0000-4000-8000-000000000003',
            description: 'Cut',
            quantity: '1',
            unitPrice: '45.00',
          },
        ],
      })
      .expect(201);

    expect(posInventory.createInvoice).toHaveBeenCalledWith(
      { user: expect.objectContaining({ tenantId: 'tenant-1' }) },
      expect.objectContaining({ branchId: '00000000-0000-4000-8000-000000000001' }),
    );
  });

  it('validates inventory payloads before invoking the service', async () => {
    await request(app.getHttpServer()).post('/partner/inventory/products').send({ sku: 'S' }).expect(400);
    expect(posInventory.createProduct).not.toHaveBeenCalled();
  });

  it('routes valid inventory movement requests to the feature service', async () => {
    posInventory.createStockMovement.mockResolvedValue({ id: 'movement-1' });

    await request(app.getHttpServer())
      .post('/partner/inventory/stock-movements')
      .send({
        branchId: '00000000-0000-4000-8000-000000000001',
        productId: '00000000-0000-4000-8000-000000000002',
        quantity: '3',
        reason: 'PURCHASE',
      })
      .expect(201);

    expect(posInventory.createStockMovement).toHaveBeenCalledWith(
      { user: expect.objectContaining({ tenantId: 'tenant-1' }) },
      expect.objectContaining({ productId: '00000000-0000-4000-8000-000000000002' }),
    );
  });

  it('routes dashboard queries to the query service', async () => {
    dashboard.getOwnerDashboard.mockResolvedValue({ branchId: 'branch-1' });
    dashboard.listDashboardAlerts.mockResolvedValue({ items: [], page: { limit: 0, nextCursor: null, hasMore: false } });

    await request(app.getHttpServer())
      .get('/partner/dashboard/owner?branchId=branch-1&date=2026-05-26')
      .expect(200);
    await request(app.getHttpServer()).get('/partner/dashboard/alerts?branchId=branch-1').expect(200);

    expect(dashboard.getOwnerDashboard).toHaveBeenCalledWith(
      { user: expect.objectContaining({ tenantId: 'tenant-1' }) },
      'branch-1',
      '2026-05-26',
    );
    expect(dashboard.listDashboardAlerts).toHaveBeenCalledWith({ user: expect.objectContaining({ tenantId: 'tenant-1' }) }, 'branch-1');
  });
});
