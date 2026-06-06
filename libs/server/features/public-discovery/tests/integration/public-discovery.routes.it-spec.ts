import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { PublicDiscoveryController } from '../../src/lib/controllers/public-discovery.controller';
import { PublicDiscoveryService } from '../../src/lib/services/public-discovery.service';

describe('PublicDiscoveryController routes', () => {
  let app: INestApplication;
  const service = {
    getPublicHome: jest.fn().mockResolvedValue({ featuredSalons: [], popularServices: [], nearbyAreas: [], seo: { title: 'Home', description: 'Home' } }),
    searchPublicSalons: jest.fn().mockResolvedValue({ items: [], page: { limit: 20, nextCursor: null, hasMore: false } }),
    getPublicSalonProfile: jest.fn().mockResolvedValue({ salonId: 'business-1' }),
    listPublicSalonServices: jest.fn().mockResolvedValue({ items: [], page: { limit: 20, nextCursor: null, hasMore: false } }),
    listPublicSalonReviews: jest.fn().mockResolvedValue({ items: [], page: { limit: 20, nextCursor: null, hasMore: false } }),
    listPublicSalonPortfolio: jest.fn().mockResolvedValue({ items: [], page: { limit: 20, nextCursor: null, hasMore: false } }),
    getPublicAvailabilitySignal: jest.fn().mockResolvedValue({ hasAvailability: false, earliestSlotAt: null, branchSignals: [] }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PublicDiscoveryController],
      providers: [{ provide: PublicDiscoveryService, useValue: service }],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('exposes public discovery route set', async () => {
    await request(app.getHttpServer()).get('/public/home').expect(200);
    await request(app.getHttpServer()).get('/public/salons').expect(200);
    await request(app.getHttpServer()).get('/public/salons/glow-123').expect(200);
    await request(app.getHttpServer()).get('/public/salons/glow-123/services').expect(200);
    await request(app.getHttpServer()).get('/public/salons/glow-123/reviews').expect(200);
    await request(app.getHttpServer()).get('/public/salons/glow-123/portfolio').expect(200);
    await request(app.getHttpServer()).get('/public/salons/glow-123/availability').expect(200);
  });
});
