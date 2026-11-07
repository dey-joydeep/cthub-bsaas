import type { BranchProfile, SalonBusiness } from '../features/salon-owner-settings/models/salon-owner-settings.models';
import type {
  BusinessRole,
  PermissionItem,
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
  roles: BusinessRole[];
  permissions: PermissionItem[];
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

  const permissions: PermissionItem[] = [
    { code: 'salon.business.manage', name: 'Manage Business', category: 'Settings', description: 'Edit business profile, legal info, and tax registration' },
    { code: 'salon.branch.manage', name: 'Manage Branches', category: 'Settings', description: 'Configure branch details, operating hours, and booking policies' },
    { code: 'staff.roles.manage', name: 'Manage Staff Roles', category: 'Staff', description: 'Assign operational roles and permissions to staff' },
    { code: 'staff.shifts.manage', name: 'Manage Rosters', category: 'Staff', description: 'Plan weekly shifts and schedules across branches' },
    { code: 'staff.leave.manage', name: 'Manage Leave', category: 'Staff', description: 'Approve and record staff leave blocks' },
    { code: 'appointments.manage', name: 'Manage Bookings', category: 'Appointments', description: 'Create, reschedule, or cancel client appointments' },
    { code: 'appointments.assigned.manage', name: 'Assigned Appointments', category: 'Appointments', description: 'View and update status of personal assigned chair appointments' },
    { code: 'pos.checkout', name: 'POS Checkout', category: 'Billing', description: 'Draft invoices and take client payments' },
    { code: 'pos.payment.capture', name: 'Capture Payments', category: 'Billing', description: 'Finalize transactions, issue receipts, and apply discounts' },
    { code: 'finance.reports.view', name: 'Financial Reports', category: 'Finance', description: 'View business revenue snapshot and sales reports' },
    { code: 'inventory.stock.manage', name: 'Manage Stock', category: 'Inventory', description: 'Track product quantities, receive shipments, and adjust inventory' },
    { code: 'catalog.manage', name: 'Manage Services', category: 'Catalog', description: 'Create and price service catalog offerings' },
  ];

  const roles: BusinessRole[] = [
    {
      id: 'role-owner',
      businessId: 'biz-tokyo-1',
      roleCode: 'OWNER',
      name: 'Owner & General Manager',
      description: 'Complete operational and financial authority across all branches, tax settings, staff compensation, and role definitions.',
      permissions: [
        'salon.business.manage',
        'salon.branch.manage',
        'staff.roles.manage',
        'staff.shifts.manage',
        'staff.leave.manage',
        'appointments.manage',
        'pos.checkout',
        'pos.payment.capture',
        'finance.reports.view',
        'inventory.stock.manage',
        'catalog.manage',
      ],
      isSystemDefault: true,
      isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'role-manager',
      businessId: 'biz-tokyo-1',
      roleCode: 'MANAGER',
      name: 'Branch Manager',
      description: 'Branch-scoped operational control: roster planning, leave approvals, client CRM, appointment management, and branch schedule hours.',
      permissions: [
        'salon.branch.manage',
        'staff.shifts.manage',
        'staff.leave.manage',
        'appointments.manage',
        'pos.checkout',
        'pos.payment.capture',
        'catalog.manage',
      ],
      isSystemDefault: true,
      isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'role-stylist',
      businessId: 'biz-tokyo-1',
      roleCode: 'STYLIST',
      name: 'Stylist & Hair Artist',
      description: 'Service delivery, chair appointments, personal roster view, and customer consultation notes.',
      permissions: ['appointments.assigned.manage'],
      isSystemDefault: true,
      isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'role-receptionist',
      businessId: 'biz-tokyo-1',
      roleCode: 'RECEPTIONIST',
      name: 'Front Desk Coordinator',
      description: 'Front-of-house operations: booking/rescheduling appointments, walk-in queue management, customer lookup, and basic checkout.',
      permissions: ['appointments.manage', 'pos.checkout'],
      isSystemDefault: true,
      isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'role-cashier',
      businessId: 'biz-tokyo-1',
      roleCode: 'CASHIER',
      name: 'POS Cashier',
      description: 'Finalizing client invoices, capturing cash/card payments, processing receipts, and applying authorized discounts.',
      permissions: ['pos.checkout', 'pos.payment.capture'],
      isSystemDefault: true,
      isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'role-inventory',
      businessId: 'biz-tokyo-1',
      roleCode: 'INVENTORY_MANAGER',
      name: 'Stock & Supply Manager',
      description: 'Managing salon product stock, tracking chemical bar usage, recording shipments, and replenishing retail shelves.',
      permissions: ['inventory.stock.manage'],
      isSystemDefault: true,
      isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
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
      roleIds: ['role-owner', 'role-manager'],
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
      roleIds: ['role-stylist', 'role-cashier'],
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
      roleIds: ['role-stylist'],
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
    roles,
    permissions,
    staff,
    leaveBlocks,
    shifts,
    currentUser,
  };
}
