import type { AuthenticatedUser } from '@cthub-bsaas/shared';

import { CustomerAppController } from './customer-app.controller';
import { CustomerAppService } from '../services/customer-app.service';

describe('CustomerAppController', () => {
  const user: AuthenticatedUser = { id: 'user-1', email: 'customer@example.com', roles: [] };
  const service = {
    getCustomerDashboard: jest.fn(),
    getCustomerBookingContext: jest.fn(),
    createCustomerBooking: jest.fn(),
    listCustomerAppointments: jest.fn(),
    rescheduleCustomerAppointment: jest.fn(),
    cancelCustomerAppointment: jest.fn(),
    listCustomerFavorites: jest.fn(),
    upsertCustomerFavorite: jest.fn(),
    listCustomerRewards: jest.fn(),
    listCustomerReceipts: jest.fn(),
    submitCustomerReview: jest.fn(),
  } as unknown as jest.Mocked<CustomerAppService>;
  const controller = new CustomerAppController(service);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('routes dashboard, booking context, and booking commands', async () => {
    const contextQuery = { businessId: 'business-1' };
    const booking = { businessId: 'business-1', branchId: 'branch-1', serviceIds: ['service-1'], startAt: '2026-05-27T09:00:00.000Z' };

    await controller.getCustomerDashboard(user);
    await controller.getCustomerBookingContext(contextQuery);
    await controller.createCustomerBooking(user, booking);

    expect(service.getCustomerDashboard).toHaveBeenCalledWith(user);
    expect(service.getCustomerBookingContext).toHaveBeenCalledWith(contextQuery);
    expect(service.createCustomerBooking).toHaveBeenCalledWith(user, booking);
  });

  it('routes appointment lifecycle commands', async () => {
    await controller.listCustomerAppointments(user, '10');
    await controller.rescheduleCustomerAppointment(user, 'appointment-1', { startAt: '2026-05-27T10:00:00.000Z' });
    await controller.cancelCustomerAppointment(user, 'appointment-1', { reason: 'schedule changed' });

    expect(service.listCustomerAppointments).toHaveBeenCalledWith(user, 10);
    expect(service.rescheduleCustomerAppointment).toHaveBeenCalledWith(user, 'appointment-1', { startAt: '2026-05-27T10:00:00.000Z' });
    expect(service.cancelCustomerAppointment).toHaveBeenCalledWith(user, 'appointment-1', { reason: 'schedule changed' });
  });

  it('routes favorites, rewards, receipts, and reviews', async () => {
    await controller.listCustomerFavorites(user, 'salon');
    await controller.upsertCustomerFavorite(user, 'salon', 'target-1', { favorite: true });
    await controller.listCustomerRewards(user, 'business-1');
    await controller.listCustomerReceipts(user, 'business-1', '5');
    await controller.submitCustomerReview(user, { appointmentId: 'appointment-1', rating: 5 });

    expect(service.listCustomerFavorites).toHaveBeenCalledWith(user, 'salon');
    expect(service.upsertCustomerFavorite).toHaveBeenCalledWith(user, 'salon', 'target-1', { favorite: true });
    expect(service.listCustomerRewards).toHaveBeenCalledWith(user, 'business-1');
    expect(service.listCustomerReceipts).toHaveBeenCalledWith(user, 'business-1', 5);
    expect(service.submitCustomerReview).toHaveBeenCalledWith(user, { appointmentId: 'appointment-1', rating: 5 });
  });
});
