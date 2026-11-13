import { ConflictException, ForbiddenException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '@cthub-bsaas/shared';
import type { PrismaService } from '@cthub-bsaas/server-data-access';

import { CustomerCrmService } from './customer-crm.service';

const now = new Date('2026-05-26T00:00:00.000Z');

function user(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return { id: 'user-1', email: 'owner@example.com', roles: [], tenantId: 'tenant-1', ...overrides };
}

function business() {
  return {
    id: 'business-1',
    tenantId: 'tenant-1',
    displayName: 'Salon One',
    legalName: 'Salon One Legal',
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  };
}

function customer(overrides: Record<string, unknown> = {}) {
  return {
    id: 'customer-1',
    businessId: 'business-1',
    displayName: 'Customer One',
    phone: '09000000001',
    email: 'customer@example.com',
    dateOfBirth: new Date('1990-01-01T00:00:00.000Z'),
    consentForMarketing: true,
    smsEnabled: false,
    emailEnabled: false,
    whatsappEnabled: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function prismaKnownError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('known request error', { code, clientVersion: 'test' });
}

function createPrismaMock() {
  return {
    salonBusiness: { findFirst: jest.fn() },
    salonOwnerCustomer: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    salonOwnerCustomerNote: { create: jest.fn() },
  };
}

describe('CustomerCrmService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: CustomerCrmService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new CustomerCrmService(prisma as unknown as PrismaService);
  });

  it('searches customers within the default tenant business', async () => {
    prisma.salonBusiness.findFirst.mockResolvedValue(business());
    prisma.salonOwnerCustomer.findMany.mockResolvedValue([customer(), customer({ id: 'customer-2', phone: '09000000002' })]);

    const result = await service.searchCustomers({ user: user() }, { search: 'cust', page: '2', pageSize: '1' });

    expect(prisma.salonOwnerCustomer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ businessId: 'business-1' }),
        skip: 1,
        take: 2,
      }),
    );
    expect(result.page).toEqual({ limit: 1, nextCursor: '3', hasMore: true });
    expect(result.items[0]).toMatchObject({ id: 'customer-1', dateOfBirth: '1990-01-01' });
  });

  it('requires tenant scope and an existing tenant business', async () => {
    await expect(service.searchCustomers({ user: user({ tenantId: undefined }) })).rejects.toBeInstanceOf(ForbiddenException);

    prisma.salonBusiness.findFirst.mockResolvedValue(null);
    await expect(service.searchCustomers({ user: user() })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates customers and maps duplicate phone numbers to conflict', async () => {
    prisma.salonBusiness.findFirst.mockResolvedValue(business());
    prisma.salonOwnerCustomer.create.mockResolvedValue(customer({ displayName: 'Trimmed', consentForMarketing: false }));

    await expect(
      service.createCustomer(
        { user: user() },
        { displayName: ' Trimmed ', phone: ' 09000000001 ', email: ' customer@example.com ', dateOfBirth: '1990-01-01' },
      ),
    ).resolves.toMatchObject({ displayName: 'Trimmed', consentForMarketing: false });

    prisma.salonOwnerCustomer.create.mockRejectedValueOnce(prismaKnownError('P2002'));
    await expect(service.createCustomer({ user: user() }, { displayName: 'Customer One', phone: '09000000001' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects future birth dates', async () => {
    prisma.salonBusiness.findFirst.mockResolvedValue(business());

    await expect(
      service.createCustomer({ user: user() }, { displayName: 'Customer One', phone: '09000000001', dateOfBirth: '2999-01-01' }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('rejects required customer text that is blank after trimming', async () => {
    prisma.salonBusiness.findFirst.mockResolvedValue(business());
    prisma.salonOwnerCustomer.findFirst.mockResolvedValue(customer());

    await expect(service.createCustomer({ user: user() }, { displayName: '   ', phone: '09000000001' })).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
    await expect(service.createCustomer({ user: user() }, { displayName: 'Customer One', phone: '   ' })).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
    await expect(
      service.createCustomerNote({ user: user() }, 'customer-1', { body: '   ', visibility: 'STAFF_VISIBLE' }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('updates customer profile, notes, preferences, and visit history', async () => {
    prisma.salonOwnerCustomer.findFirst.mockResolvedValue(customer());
    prisma.salonOwnerCustomer.update.mockResolvedValue(customer({ smsEnabled: true, emailEnabled: true, whatsappEnabled: false }));
    prisma.salonOwnerCustomerNote.create.mockResolvedValue({
      id: 'note-1',
      customerId: 'customer-1',
      body: 'Prefers morning',
      visibility: 'STAFF_VISIBLE',
      createdAt: now,
    });

    await expect(service.getCustomer({ user: user() }, 'customer-1')).resolves.toMatchObject({ id: 'customer-1' });
    await expect(
      service.updateCustomer({ user: user() }, 'customer-1', { displayName: 'Customer One', phone: '09000000001' }),
    ).resolves.toMatchObject({ id: 'customer-1' });
    expect(prisma.salonOwnerCustomer.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({ consentForMarketing: expect.any(Boolean) }),
      }),
    );
    await expect(
      service.createCustomerNote({ user: user() }, 'customer-1', { body: ' Prefers morning ', visibility: 'STAFF_VISIBLE' }),
    ).resolves.toMatchObject({ id: 'note-1', body: 'Prefers morning' });
    await expect(
      service.updateCustomerCommunicationPreferences({ user: user() }, 'customer-1', {
        smsEnabled: true,
        emailEnabled: true,
        whatsappEnabled: false,
      }),
    ).resolves.toEqual({ customerId: 'customer-1', smsEnabled: true, emailEnabled: true, whatsappEnabled: false });
    await expect(service.getCustomerVisitHistory({ user: user() }, 'customer-1')).resolves.toMatchObject({ items: [] });
  });

  it('validates pagination, birth date format, missing customers, and update errors', async () => {
    prisma.salonBusiness.findFirst.mockResolvedValue(business());
    prisma.salonOwnerCustomer.findMany.mockResolvedValue([customer({ email: null, dateOfBirth: null })]);

    const defaultPage = await service.searchCustomers({ user: user() });
    expect(defaultPage.page).toEqual({ limit: 25, nextCursor: null, hasMore: false });
    expect(defaultPage.items[0]).not.toHaveProperty('email');
    expect(defaultPage.items[0]).not.toHaveProperty('dateOfBirth');

    await expect(service.searchCustomers({ user: user() }, { page: 'abc' })).rejects.toBeInstanceOf(UnprocessableEntityException);
    await expect(service.searchCustomers({ user: user() }, { page: '0' })).rejects.toBeInstanceOf(UnprocessableEntityException);
    await expect(
      service.createCustomer({ user: user() }, { displayName: 'Customer One', phone: '09000000001', dateOfBirth: '1990/01/01' }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    prisma.salonOwnerCustomer.create.mockRejectedValueOnce(new Error('unexpected create error'));
    await expect(service.createCustomer({ user: user() }, { displayName: 'Customer One', phone: '09000000001' })).rejects.toThrow(
      'unexpected create error',
    );

    prisma.salonOwnerCustomer.findFirst.mockResolvedValueOnce(null);
    await expect(service.getCustomer({ user: user() }, 'missing')).rejects.toBeInstanceOf(NotFoundException);

    prisma.salonOwnerCustomer.findFirst.mockResolvedValue(customer());
    prisma.salonOwnerCustomer.update.mockResolvedValueOnce(customer({ consentForMarketing: true }));
    await expect(
      service.updateCustomer({ user: user() }, 'customer-1', {
        displayName: 'Customer One',
        phone: '09000000001',
        consentForMarketing: true,
      }),
    ).resolves.toMatchObject({ consentForMarketing: true });

    prisma.salonOwnerCustomer.update.mockRejectedValueOnce(prismaKnownError('P2002'));
    await expect(
      service.updateCustomer({ user: user() }, 'customer-1', { displayName: 'Customer One', phone: '09000000001' }),
    ).rejects.toBeInstanceOf(ConflictException);

    prisma.salonOwnerCustomer.update.mockRejectedValueOnce(new Error('unexpected update error'));
    await expect(
      service.updateCustomer({ user: user() }, 'customer-1', { displayName: 'Customer One', phone: '09000000001' }),
    ).rejects.toThrow('unexpected update error');
  });
});
