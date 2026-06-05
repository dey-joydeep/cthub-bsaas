import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { BranchSettingsController } from '../../src/lib/controllers/branch-settings.controller';
import { BusinessSettingsController } from '../../src/lib/controllers/business-settings.controller';
import { SalonOwnerSettingsService } from '../../src/lib/services/salon-owner-settings.service';

describe('Salon owner settings routes', () => {
  const branchId = '11111111-1111-4111-8111-111111111111';
  let app: INestApplication;
  const service = {
    createBusiness: jest.fn(),
    replaceBranchHours: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [BusinessSettingsController, BranchSettingsController],
      providers: [{ provide: SalonOwnerSettingsService, useValue: service }],
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
});
