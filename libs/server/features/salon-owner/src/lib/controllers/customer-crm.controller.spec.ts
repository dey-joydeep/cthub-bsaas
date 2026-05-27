import type { AuthenticatedUser } from '@cthub-bsaas/shared';

import { CustomerCrmController } from './customer-crm.controller';
import type { CustomerCrmService } from '../services/customer-crm.service';

const user: AuthenticatedUser = { id: 'user-1', email: 'owner@example.com', roles: [], tenantId: 'tenant-1' };

function serviceMock() {
  return {
    searchCustomers: jest.fn(),
    createCustomer: jest.fn(),
    getCustomer: jest.fn(),
    updateCustomer: jest.fn(),
    createCustomerNote: jest.fn(),
    updateCustomerCommunicationPreferences: jest.fn(),
    getCustomerVisitHistory: jest.fn(),
  };
}

describe('CustomerCrmController', () => {
  it('delegates customer CRM routes to the service with authenticated context', async () => {
    const service = serviceMock();
    const controller = new CustomerCrmController(service as unknown as CustomerCrmService);
    const customer = { displayName: 'Customer One', phone: '09000000001' };
    const note = { body: 'Prefers morning', visibility: 'STAFF_VISIBLE' as const };
    const preferences = { smsEnabled: true, emailEnabled: false, whatsappEnabled: false };

    await controller.searchCustomers(user, 'cust', '2', '25');
    await controller.createCustomer(user, customer);
    await controller.getCustomer(user, 'customer-1');
    await controller.updateCustomer(user, 'customer-1', customer);
    await controller.createCustomerNote(user, 'customer-1', note);
    await controller.updateCustomerCommunicationPreferences(user, 'customer-1', preferences);
    await controller.getCustomerVisitHistory(user, 'customer-1');

    expect(service.searchCustomers).toHaveBeenCalledWith({ user }, { search: 'cust', page: '2', pageSize: '25' });
    expect(service.createCustomer).toHaveBeenCalledWith({ user }, customer);
    expect(service.getCustomer).toHaveBeenCalledWith({ user }, 'customer-1');
    expect(service.updateCustomer).toHaveBeenCalledWith({ user }, 'customer-1', customer);
    expect(service.createCustomerNote).toHaveBeenCalledWith({ user }, 'customer-1', note);
    expect(service.updateCustomerCommunicationPreferences).toHaveBeenCalledWith({ user }, 'customer-1', preferences);
    expect(service.getCustomerVisitHistory).toHaveBeenCalledWith({ user }, 'customer-1');
  });
});
