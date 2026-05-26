import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { CustomerAppController } from '../../src/lib/controllers/customer-app.controller';
import { CustomerAppService } from '../../src/lib/services/customer-app.service';

describe('CustomerAppController routes', () => {
  let app: INestApplication;
  const service = {
    getCustomerDashboard: jest.fn().mockResolvedValue({}),
    getCustomerBookingContext: jest.fn().mockResolvedValue({}),
    createCustomerBooking: jest.fn().mockResolvedValue({ appointmentId: 'appointment-1' }),
    listCustomerAppointments: jest.fn().mockResolvedValue({ items: [], page: { limit: 20, nextCursor: null, hasMore: false } }),
    rescheduleCustomerAppointment: jest.fn().mockResolvedValue({ appointmentId: 'appointment-1' }),
    cancelCustomerAppointment: jest.fn().mockResolvedValue({ appointmentId: 'appointment-1', status: 'CANCELLED' }),
    listCustomerFavorites: jest.fn().mockResolvedValue({ items: [], page: { limit: 20, nextCursor: null, hasMore: false } }),
    upsertCustomerFavorite: jest.fn().mockResolvedValue({ targetType: 'salon', targetId: 'target-1', favorite: true }),
    listCustomerRewards: jest.fn().mockResolvedValue({ items: [], page: { limit: 20, nextCursor: null, hasMore: false } }),
    listCustomerReceipts: jest.fn().mockResolvedValue({ items: [], page: { limit: 20, nextCursor: null, hasMore: false } }),
    submitCustomerReview: jest.fn().mockResolvedValue({ reviewId: 'review-1' }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CustomerAppController],
      providers: [{ provide: CustomerAppService, useValue: service }],
    }).compile();
    app = moduleRef.createNestApplication();
    app.use((req: { user?: unknown }, _res: unknown, next: () => void) => {
      req.user = { id: 'user-1', email: 'customer@example.com', roles: [] };
      next();
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('exposes customer app route set', async () => {
    await request(app.getHttpServer()).get('/customer/dashboard').expect(200);
    await request(app.getHttpServer()).get('/customer/booking/context').expect(200);
    await request(app.getHttpServer()).post('/customer/bookings').send({}).expect(201);
    await request(app.getHttpServer()).get('/customer/appointments').expect(200);
    await request(app.getHttpServer()).post('/customer/appointments/appointment-1/reschedule').send({}).expect(201);
    await request(app.getHttpServer()).post('/customer/appointments/appointment-1/cancel').send({}).expect(201);
    await request(app.getHttpServer()).get('/customer/favorites').expect(200);
    await request(app.getHttpServer()).put('/customer/favorites/salon/target-1').send({ favorite: true }).expect(200);
    await request(app.getHttpServer()).get('/customer/rewards').expect(200);
    await request(app.getHttpServer()).get('/customer/receipts').expect(200);
    await request(app.getHttpServer()).post('/customer/reviews').send({}).expect(201);
  });
});
