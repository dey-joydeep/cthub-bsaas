import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { BranchSettingsController } from '../../src/lib/controllers/branch-settings.controller';
import { BusinessSettingsController } from '../../src/lib/controllers/business-settings.controller';
import { DashboardController } from '../../src/lib/controllers/dashboard.controller';
import { DashboardQueryService } from '../../src/lib/services/dashboard-query.service';
import { SalonOwnerSettingsService } from '../../src/lib/services/salon-owner-settings.service';

describe('Salon owner settings routes', () => {
  let app: INestApplication;
  const service = {
    createBusiness: jest.fn(),
    replaceBranchHours: jest.fn(),
  };
  const dashboard = {
    getOwnerDashboard: jest.fn(),
    listDashboardAlerts: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [BusinessSettingsController, BranchSettingsController, DashboardController],
      providers: [
        { provide: SalonOwnerSettingsService, useValue: service },
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
