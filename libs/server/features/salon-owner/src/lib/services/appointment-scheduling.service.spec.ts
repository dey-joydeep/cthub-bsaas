import { ConflictException, ForbiddenException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '@cthub-bsaas/shared';
import type { PrismaService } from '@cthub-bsaas/server-data-access';

import { AppointmentSchedulingService } from './appointment-scheduling.service';

const now = new Date('2026-05-26T00:00:00.000Z');

function user(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return { id: 'user-1', email: 'owner@example.com', roles: [], tenantId: 'tenant-1', ...overrides };
}

function branch() {
  return { id: 'branch-1', businessId: 'business-1', name: 'Main', timezone: 'Asia/Tokyo', currency: 'JPY', address: {}, createdAt: now, updatedAt: now };
}

function serviceRecord() {
  return {
    id: 'service-1',
    businessId: 'business-1',
    categoryId: 'category-1',
    name: 'Cut',
    durationMinutes: 45,
    bufferMinutes: 5,
    basePrice: new Prisma.Decimal('35.00'),
    taxRatePercent: new Prisma.Decimal('10.00'),
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  };
}

function staff() {
  return {
    id: 'staff-1',
    businessId: 'business-1',
    displayName: 'Stylist One',
    phone: '09000000001',
    email: null,
    status: 'ACTIVE',
    roles: [],
    createdAt: now,
    updatedAt: now,
  };
}

function line(overrides: Record<string, unknown> = {}) {
  return {
    id: 'line-1',
    appointmentId: 'appointment-1',
    serviceId: 'service-1',
    staffId: 'staff-1',
    startsAt: new Date('2026-05-26T09:00:00.000Z'),
    endsAt: new Date('2026-05-26T09:50:00.000Z'),
    serviceName: 'Cut',
    staffName: 'Stylist One',
    durationMinutes: 45,
    createdAt: now,
    ...overrides,
  };
}

function appointment(overrides: Record<string, unknown> = {}) {
  return {
    id: 'appointment-1',
    branchId: 'branch-1',
    customerId: 'customer-1',
    status: 'BOOKED',
    notes: 'First visit',
    estimatedWaitMinutes: null,
    rescheduleReason: null,
    cancellationReason: null,
    lines: [line()],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function createPrismaMock() {
  const prisma = {
    salonBranch: { findFirst: jest.fn(), findFirstOrThrow: jest.fn() },
    salonOwnerCustomer: { findFirst: jest.fn() },
    salonOwnerService: { findMany: jest.fn() },
    salonOwnerStaff: { findMany: jest.fn() },
    salonOwnerAppointment: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    salonOwnerAppointmentLine: {
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn(async (callback: (tx: unknown) => unknown) => callback(prisma)),
  };
  return prisma;
}

const appointmentInput = {
  branchId: 'branch-1',
  customerId: 'customer-1',
  lines: [{ serviceId: 'service-1', staffId: 'staff-1', startsAt: '2026-05-26T09:00:00.000Z' }],
  notes: ' First visit ',
};

describe('AppointmentSchedulingService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: AppointmentSchedulingService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new AppointmentSchedulingService(prisma as unknown as PrismaService);
    prisma.salonBranch.findFirst.mockResolvedValue(branch());
    prisma.salonBranch.findFirstOrThrow.mockResolvedValue(branch());
    prisma.salonOwnerCustomer.findFirst.mockResolvedValue({ id: 'customer-1', businessId: 'business-1' });
    prisma.salonOwnerService.findMany.mockResolvedValue([serviceRecord()]);
    prisma.salonOwnerStaff.findMany.mockResolvedValue([staff()]);
    prisma.salonOwnerAppointmentLine.findFirst.mockResolvedValue(null);
  });

  it('requires tenant scope', async () => {
    await expect(service.getAppointmentDayBoard({ user: user({ tenantId: undefined }) }, 'branch-1', '2026-05-26')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('returns day board appointments for a branch and date', async () => {
    prisma.salonOwnerAppointment.findMany.mockResolvedValue([appointment()]);

    const result = await service.getAppointmentDayBoard({ user: user() }, 'branch-1', '2026-05-26');

    expect(result.appointments[0]).toMatchObject({ id: 'appointment-1', status: 'BOOKED' });
    expect(prisma.salonOwnerAppointment.findMany).toHaveBeenCalledWith(expect.objectContaining({ include: { lines: true } }));
  });

  it('rejects invalid day-board dates', async () => {
    await expect(service.getAppointmentDayBoard({ user: user() }, 'branch-1', 'bad-date')).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('finds simple slots from active staff and active services', async () => {
    const result = await service.findAppointmentSlots({ user: user() }, 'branch-1', ['service-1'], '2026-05-26');

    expect(result.items[0]).toMatchObject({ staffId: 'staff-1', startsAt: '2026-05-26T09:00:00.000Z' });
  });

  it('creates regular and walk-in appointments after conflict checks', async () => {
    prisma.salonOwnerAppointment.create.mockResolvedValueOnce(appointment()).mockResolvedValueOnce(appointment({ estimatedWaitMinutes: 10 }));

    await expect(service.createAppointment({ user: user() }, appointmentInput)).resolves.toMatchObject({ id: 'appointment-1' });
    await expect(service.createWalkInAppointment({ user: user() }, { ...appointmentInput, estimatedWaitMinutes: 10 })).resolves.toMatchObject({
      estimatedWaitMinutes: 10,
    });
  });

  it('maps overlapping staff appointments to conflicts', async () => {
    prisma.salonOwnerAppointmentLine.findFirst.mockResolvedValue(line());

    await expect(service.createAppointment({ user: user() }, appointmentInput)).rejects.toBeInstanceOf(ConflictException);
  });

  it('reschedules and transitions existing appointments', async () => {
    prisma.salonOwnerAppointment.findFirst.mockResolvedValue(appointment());
    prisma.salonOwnerAppointment.update.mockResolvedValue(appointment({ status: 'CONFIRMED' }));

    await expect(
      service.rescheduleAppointment({ user: user() }, 'appointment-1', {
        lines: appointmentInput.lines,
        reason: 'Customer request',
      }),
    ).resolves.toMatchObject({ id: 'appointment-1' });
    await expect(service.confirmAppointment({ user: user() }, 'appointment-1')).resolves.toMatchObject({ status: 'CONFIRMED' });
    await expect(service.cancelAppointment({ user: user() }, 'appointment-1', { reason: 'Customer request' })).resolves.toMatchObject({
      status: 'CONFIRMED',
    });
    await expect(service.markAppointmentNoShow({ user: user() }, 'appointment-1')).resolves.toMatchObject({ status: 'CONFIRMED' });
    await expect(service.markAppointmentArrived({ user: user() }, 'appointment-1')).resolves.toMatchObject({ status: 'CONFIRMED' });
    await expect(service.startAppointmentService({ user: user() }, 'appointment-1')).resolves.toMatchObject({ status: 'CONFIRMED' });
    await expect(service.completeAppointment({ user: user() }, 'appointment-1')).resolves.toMatchObject({ status: 'CONFIRMED' });
  });

  it('returns not found for out-of-scope appointments and missing services', async () => {
    prisma.salonOwnerAppointment.findFirst.mockResolvedValue(null);
    await expect(service.getAppointment({ user: user() }, 'missing')).rejects.toBeInstanceOf(NotFoundException);

    prisma.salonOwnerService.findMany.mockResolvedValue([]);
    await expect(service.findAppointmentSlots({ user: user() }, 'branch-1', ['missing-service'], '2026-05-26')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
