import type { BranchProfile, SalonBusiness } from '../features/salon-owner-settings/models/salon-owner-settings.models';
import type {
  Service,
  ServiceCategory,
  Staff,
  StaffLeaveBlock,
  StaffShiftInput,
} from '../features/staff-service-catalog/models/staff-service-catalog.models';
import type { PartnerAuthUser } from '../features/auth/models/auth.models';

export interface PartnerDevMockState {
  businesses: SalonBusiness[];
  branches: BranchProfile[];
  categories: ServiceCategory[];
  services: Service[];
  staff: Staff[];
  leaveBlocks: StaffLeaveBlock[];
  shifts: Record<string, StaffShiftInput>;
  currentUser: PartnerAuthUser;
}

export function createInitialPartnerDevMockData(): PartnerDevMockState {
  const businesses: SalonBusiness[] = [
    {
      id: 'biz-tokyo-1',
      tenantId: 'tenant-1',
      displayName: 'Lumiere Salon & Spa Tokyo',
      legalName: 'Lumiere Beauty Co., Ltd.',
      status: 'ACTIVE',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  const branches: BranchProfile[] = [
    {
      id: 'branch-ginza',
      businessId: 'biz-tokyo-1',
      name: 'Ginza Flagship',
      timezone: 'Asia/Tokyo',
      currency: 'JPY',
      status: 'ACTIVE',
      phone: '+81-3-5555-0101',
      email: 'ginza@tokyosalon.jp',
      address: {
        line1: '6-10-1 Ginza, Chuo-ku',
        city: 'Tokyo',
        state: 'Tokyo',
        postalCode: '104-0061',
        country: 'Japan',
      },
      createdAt: '2026-01-15T09:00:00.000Z',
      updatedAt: '2026-01-15T09:00:00.000Z',
    },
    {
      id: 'branch-shibuya',
      businessId: 'biz-tokyo-1',
      name: 'Shibuya Studio',
      timezone: 'Asia/Tokyo',
      currency: 'JPY',
      status: 'ACTIVE',
      phone: '+81-3-5555-0202',
      email: 'shibuya@tokyosalon.jp',
      address: {
        line1: '1-23-10 Jinnan, Shibuya-ku',
        city: 'Tokyo',
        state: 'Tokyo',
        postalCode: '150-0041',
        country: 'Japan',
      },
      createdAt: '2026-02-01T09:00:00.000Z',
      updatedAt: '2026-02-01T09:00:00.000Z',
    },
    {
      id: 'branch-roppongi',
      businessId: 'biz-tokyo-1',
      name: 'Roppongi Hills Spa',
      timezone: 'Asia/Tokyo',
      currency: 'JPY',
      status: 'ACTIVE',
      phone: '+81-3-5555-0303',
      email: 'roppongi@tokyosalon.jp',
      address: {
        line1: '6-10-1 Roppongi, Minato-ku',
        city: 'Tokyo',
        state: 'Tokyo',
        postalCode: '106-6108',
        country: 'Japan',
      },
      createdAt: '2026-03-01T09:00:00.000Z',
      updatedAt: '2026-03-01T09:00:00.000Z',
    },
  ];

  const categories: ServiceCategory[] = [
    {
      id: 'cat-hair-cut',
      name: 'Cuts & Styling',
      sortOrder: 1,
    },
    {
      id: 'cat-color',
      name: 'Color & Highlights',
      sortOrder: 2,
    },
    {
      id: 'cat-treatment',
      name: 'Spa & Scalp Treatments',
      sortOrder: 3,
    },
  ];

  const services: Service[] = [
    {
      id: 'svc-exec-cut',
      categoryId: 'cat-hair-cut',
      name: 'Executive Precision Cut',
      durationMinutes: 45,
      bufferMinutes: 10,
      basePrice: '65.00',
      taxRatePercent: '10.00',
      status: 'ACTIVE',
      eligibleStaffIds: ['staff-kenji', 'staff-sarah'],
    },
    {
      id: 'svc-balayage',
      categoryId: 'cat-color',
      name: 'Signature Balayage & Gloss',
      durationMinutes: 120,
      bufferMinutes: 15,
      basePrice: '180.00',
      taxRatePercent: '10.00',
      status: 'ACTIVE',
      eligibleStaffIds: ['staff-sarah', 'staff-elena'],
    },
    {
      id: 'svc-scalp-ritual',
      categoryId: 'cat-treatment',
      name: 'Head Spa Deep Renewal Ritual',
      durationMinutes: 60,
      bufferMinutes: 10,
      basePrice: '95.00',
      taxRatePercent: '10.00',
      status: 'ACTIVE',
      eligibleStaffIds: ['staff-elena'],
    },
  ];

  const staff: Staff[] = [
    {
      id: 'staff-kenji',
      displayName: 'Kenji Sato',
      phone: '+81-90-1111-2222',
      email: 'kenji.sato@tokyosalon.jp',
      status: 'ACTIVE',
      branchIds: ['branch-ginza', 'branch-shibuya'],
      roles: ['OWNER', 'MANAGER'],
      skillServiceIds: ['svc-exec-cut'],
      createdAt: '2026-01-15T09:00:00.000Z',
      updatedAt: '2026-01-15T09:00:00.000Z',
    },
    {
      id: 'staff-sarah',
      displayName: 'Sarah Tanaka',
      phone: '+81-90-3333-4444',
      email: 'sarah.tanaka@tokyosalon.jp',
      status: 'ACTIVE',
      branchIds: ['branch-ginza'],
      roles: ['STYLIST', 'CASHIER'],
      skillServiceIds: ['svc-exec-cut', 'svc-balayage'],
      createdAt: '2026-02-01T09:00:00.000Z',
      updatedAt: '2026-02-01T09:00:00.000Z',
    },
    {
      id: 'staff-elena',
      displayName: 'Elena Rostova',
      phone: '+81-90-5555-6666',
      email: 'elena.rostova@tokyosalon.jp',
      status: 'ACTIVE',
      branchIds: ['branch-shibuya', 'branch-roppongi'],
      roles: ['STYLIST'],
      skillServiceIds: ['svc-balayage', 'svc-scalp-ritual'],
      createdAt: '2026-02-15T09:00:00.000Z',
      updatedAt: '2026-02-15T09:00:00.000Z',
    },
  ];

  const leaveBlocks: StaffLeaveBlock[] = [
    {
      id: 'leave-1',
      businessId: 'biz-tokyo-1',
      staffId: 'staff-sarah',
      branchId: 'branch-ginza',
      startsAt: '2026-11-12T09:00:00.000Z',
      endsAt: '2026-11-12T13:00:00.000Z',
      reason: 'Dental appointment and specialist consultation',
      createdAt: '2026-11-01T09:00:00.000Z',
      updatedAt: '2026-11-01T09:00:00.000Z',
    },
    {
      id: 'leave-2',
      businessId: 'biz-tokyo-1',
      staffId: 'staff-sarah',
      branchId: null,
      startsAt: '2026-11-20T00:00:00.000Z',
      endsAt: '2026-11-22T23:59:59.000Z',
      reason: 'Annual master stylist seminar in Osaka',
      createdAt: '2026-11-01T09:00:00.000Z',
      updatedAt: '2026-11-01T09:00:00.000Z',
    },
  ];

  const shifts: Record<string, StaffShiftInput> = {
    'staff-sarah': {
      branchId: 'branch-ginza',
      timezone: 'Asia/Tokyo',
      days: [
        { dayOfWeek: 1, intervals: [{ start: '09:00', end: '17:00' }] },
        { dayOfWeek: 2, intervals: [{ start: '09:00', end: '17:00' }] },
        { dayOfWeek: 3, intervals: [{ start: '09:00', end: '17:00' }] },
        { dayOfWeek: 4, intervals: [{ start: '09:00', end: '17:00' }] },
        { dayOfWeek: 5, intervals: [{ start: '10:00', end: '18:00' }] },
      ],
    },
  };

  const currentUser: PartnerAuthUser = {
    id: 'staff-kenji',
    email: 'kenji.sato@tokyosalon.jp',
    name: 'Kenji Sato',
    displayName: 'Kenji Sato',
    roles: ['OWNER', 'MANAGER'],
    salonBusinessId: 'biz-tokyo-1',
    branchIds: ['branch-ginza', 'branch-shibuya'],
  };

  return {
    businesses,
    branches,
    categories,
    services,
    staff,
    leaveBlocks,
    shifts,
    currentUser,
  };
}
