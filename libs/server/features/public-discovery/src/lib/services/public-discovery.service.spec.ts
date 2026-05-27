import { Prisma } from '@prisma/client';

import { PublicDiscoveryService } from './public-discovery.service';
import type { PrismaService } from '@cthub-bsaas/server-data-access';

const now = new Date('2026-05-26T00:00:00.000Z');

function branch(overrides: Record<string, unknown> = {}) {
  return {
    id: 'branch-1',
    businessId: 'business-1',
    name: 'Main',
    phone: null,
    email: null,
    timezone: 'Asia/Tokyo',
    currency: 'JPY',
    address: { city: 'Tokyo', line1: 'Shibuya', state: 'Tokyo', postalCode: '150-0000', country: 'JP' },
    policy: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function service(overrides: Record<string, unknown> = {}) {
  return {
    id: 'service-1',
    businessId: 'business-1',
    categoryId: 'category-1',
    category: { id: 'category-1', businessId: 'business-1', name: 'Hair', sortOrder: 1, createdAt: now, updatedAt: now },
    name: 'Cut',
    durationMinutes: 45,
    bufferMinutes: 5,
    basePrice: new Prisma.Decimal('35.00'),
    taxRatePercent: new Prisma.Decimal('10.00'),
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function business(overrides: Record<string, unknown> = {}) {
  return {
    id: 'business-1',
    tenantId: 'tenant-1',
    displayName: 'Glow Salon',
    legalName: 'Glow Salon LLC',
    status: 'ACTIVE',
    branches: [branch()],
    services: [service()],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function createPrismaMock() {
  return {
    salonBusiness: { findMany: jest.fn() },
    salonOwnerService: { findMany: jest.fn() },
    customerReview: { findMany: jest.fn() },
    salonBranchHours: { findFirst: jest.fn() },
    salonBranchHoliday: { findFirst: jest.fn() },
    salonOwnerStaffShift: { findMany: jest.fn() },
    salonOwnerAppointmentLine: { findMany: jest.fn() },
    salonOwnerStaffLeaveBlock: { findMany: jest.fn() },
  };
}

describe('PublicDiscoveryService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let serviceUnderTest: PublicDiscoveryService;

  beforeEach(() => {
    prisma = createPrismaMock();
    serviceUnderTest = new PublicDiscoveryService(prisma as unknown as PrismaService);
    prisma.customerReview.findMany.mockResolvedValue([]);
    prisma.salonBranchHours.findFirst.mockResolvedValue({ open: true, intervals: [{ start: '09:00', end: '17:00' }] });
    prisma.salonBranchHoliday.findFirst.mockResolvedValue(null);
    prisma.salonOwnerStaffShift.findMany.mockResolvedValue([
      { id: 'shift-1', staffId: 'staff-1', branchId: 'branch-1', timezone: 'Asia/Tokyo', days: [{ dayOfWeek: 2, intervals: [{ start: '09:00', end: '17:00' }] }] },
    ]);
    prisma.salonOwnerAppointmentLine.findMany.mockResolvedValue([]);
    prisma.salonOwnerStaffLeaveBlock.findMany.mockResolvedValue([]);
  });

  it('uses the last returned salon id as the next cursor', async () => {
    prisma.salonBusiness.findMany.mockResolvedValue([
      business({ id: 'business-1', displayName: 'Glow One' }),
      business({ id: 'business-2', displayName: 'Glow Two' }),
      business({ id: 'business-3', displayName: 'Glow Three' }),
    ]);

    const result = await serviceUnderTest.searchPublicSalons({ limit: 2 });

    expect(result.items.map((item) => item.salonId)).toEqual(['business-1', 'business-2']);
    expect(result.page).toEqual({ limit: 2, nextCursor: 'business-2', hasMore: true });
  });

  it('returns availability from actual branch hours and staff shifts', async () => {
    prisma.salonBusiness.findMany.mockResolvedValue([business()]);

    const result = await serviceUnderTest.getPublicAvailabilitySignal('glow-salon-business', { date: '2026-05-26' });

    expect(result.hasAvailability).toBe(true);
    expect(result.earliestSlotAt).toBe('2026-05-26T00:00:00.000Z');
    expect(result.branchSignals).toEqual([{ branchId: 'branch-1', hasAvailability: true, earliestSlotAt: '2026-05-26T00:00:00.000Z' }]);
  });

  it('does not advertise availability when the requested day is closed', async () => {
    prisma.salonBusiness.findMany.mockResolvedValue([business()]);
    prisma.salonBranchHours.findFirst.mockResolvedValue({ open: false, intervals: [] });

    const result = await serviceUnderTest.getPublicAvailabilitySignal('glow-salon-business', { date: '2026-05-26' });

    expect(result).toEqual({
      hasAvailability: false,
      earliestSlotAt: null,
      branchSignals: [{ branchId: 'branch-1', hasAvailability: false, earliestSlotAt: null }],
    });
  });
});
