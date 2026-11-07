import type { GeoSeedResult } from './01-geo-currencies.seed';
import type { AuthSeedResult } from './03-auth-tenants.seed';
import type { SalonBranchesSeedResult } from './04-salon-branches.seed';
import type { StaffCatalogSeedResult } from './05-staff-catalog.seed';
import type { SeedContext } from './seed-context';
import { SEED_IDS } from './seed-ids';

export async function seedTransactions(
  context: SeedContext,
  geo: GeoSeedResult,
  auth: AuthSeedResult,
  salon: SalonBranchesSeedResult,
  staff: StaffCatalogSeedResult,
): Promise<void> {
  const { prisma } = context;

  console.log('\n[7/7] Seeding Scenario & Transaction Data...');

  // 1. Staff Leave Blocks
  // Combination 1: Salon-wide leave (branchId: null)
  await prisma.salonOwnerStaffLeaveBlock.upsert({
    where: { id: SEED_IDS.leaveGlobalAnnual },
    update: {},
    create: {
      id: SEED_IDS.leaveGlobalAnnual,
      staffId: staff.staffYuki.id,
      branchId: null,
      startsAt: new Date('2026-12-20T00:00:00Z'),
      endsAt: new Date('2026-12-24T00:00:00Z'),
      reason: 'Annual Winter Holiday (Salon-wide leave across all branches)',
    },
  });

  // Combination 2: Branch-specific leave (branchId: Shibuya)
  await prisma.salonOwnerStaffLeaveBlock.upsert({
    where: { id: SEED_IDS.leaveBranchTraining },
    update: {},
    create: {
      id: SEED_IDS.leaveBranchTraining,
      staffId: staff.staffElena.id,
      branchId: salon.branchShibuya.id,
      startsAt: new Date('2026-11-25T09:00:00Z'),
      endsAt: new Date('2026-11-25T18:00:00Z'),
      reason: 'Attending Paris Styling Seminar (Shibuya branch leave only)',
    },
  });

  // Combination 3: Past historical leave
  await prisma.salonOwnerStaffLeaveBlock.upsert({
    where: { id: SEED_IDS.leaveHistoricalPast },
    update: {},
    create: {
      id: SEED_IDS.leaveHistoricalPast,
      staffId: staff.staffYuki.id,
      branchId: null,
      startsAt: new Date('2026-10-10T00:00:00Z'),
      endsAt: new Date('2026-10-12T00:00:00Z'),
      reason: 'Sick Leave (Recovered)',
    },
  });

  // Combination 4: Future scheduled leave
  await prisma.salonOwnerStaffLeaveBlock.upsert({
    where: { id: SEED_IDS.leaveFutureExam },
    update: {},
    create: {
      id: SEED_IDS.leaveFutureExam,
      staffId: staff.staffRen.id,
      branchId: salon.branchShinjuku.id,
      startsAt: new Date('2027-01-15T09:00:00Z'),
      endsAt: new Date('2027-01-18T18:00:00Z'),
      reason: 'Advanced Cosmetology Licensing Exam',
    },
  });

  // 2. Core Salon, Core Service, and Staff Linkage for Core Appointments
  const coreSalon = await prisma.salon.upsert({
    where: { slug: 'lumiere-shibuya-flagship' },
    update: {},
    create: {
      id: SEED_IDS.coreSalonShibuya,
      tenantId: auth.tenantLumiere.id,
      businessAddressId: geo.addressShibuyaId,
      name: 'Lumière Shibuya Flagship Salon',
      slug: 'lumiere-shibuya-flagship',
      ownerId: auth.userOwnerLumiere.id,
      phone: '+81-3-5555-0101',
      email: 'shibuya@lumiere-salon.jp',
      isActive: true,
      isVerified: true,
      averageRating: 4.95,
      reviewCount: 48,
    },
  });

  const coreTenantStaffYuki = await prisma.salonTenantStaff.upsert({
    where: { id: SEED_IDS.coreTenantStaffYuki },
    update: {},
    create: {
      id: SEED_IDS.coreTenantStaffYuki,
      userId: auth.userStylistYuki.id,
      salonId: coreSalon.id,
      position: 'Senior Stylist',
      isActive: true,
    },
  });

  const coreCategory = await prisma.serviceCategory.upsert({
    where: { name: 'Core Haircuts & Styling' },
    update: {},
    create: {
      id: SEED_IDS.coreCategoryHair,
      name: 'Core Haircuts & Styling',
      isActive: true,
    },
  });

  const coreServiceCut = await prisma.salonService.upsert({
    where: { id: SEED_IDS.coreServiceCut },
    update: {},
    create: {
      id: SEED_IDS.coreServiceCut,
      salonId: coreSalon.id,
      serviceCategoryId: coreCategory.id,
      name: 'Lumière Signature Cut',
      duration: 60,
      price: '6500.00',
      isActive: true,
    },
  });

  // 3. Appointments & Appointment Services
  // Appointment 1: COMPLETED (in the past)
  const apptCompleted = await prisma.appointment.upsert({
    where: { id: SEED_IDS.apptCompleted },
    update: {},
    create: {
      id: SEED_IDS.apptCompleted,
      salonTenantId: auth.tenantLumiere.id,
      customerId: auth.coreCustomerAlice.id,
      staffId: coreTenantStaffYuki.id,
      status: 'completed',
      startTime: new Date('2026-10-15T10:00:00Z'),
      endTime: new Date('2026-10-15T11:00:00Z'),
      customerNotes: 'Looking forward to the haircut!',
      customerName: 'Alice Morgan',
      customerPhone: '+81-90-2222-0001',
      customerEmail: 'customer.alice@example.com',
    },
  });

  await prisma.appointmentService.upsert({
    where: { id: SEED_IDS.apptServiceCompleted },
    update: {},
    create: {
      id: SEED_IDS.apptServiceCompleted,
      appointmentId: apptCompleted.id,
      salonServiceId: coreServiceCut.id,
      staffId: coreTenantStaffYuki.id,
      price: '6500.00',
      duration: 60,
      status: 'completed',
    },
  });

  // Appointment 2: CONFIRMED (upcoming)
  const apptConfirmed = await prisma.appointment.upsert({
    where: { id: SEED_IDS.apptConfirmed },
    update: {},
    create: {
      id: SEED_IDS.apptConfirmed,
      salonTenantId: auth.tenantLumiere.id,
      customerId: auth.coreCustomerBob.id,
      staffId: coreTenantStaffYuki.id,
      status: 'confirmed',
      startTime: new Date('2026-11-07T14:00:00Z'),
      endTime: new Date('2026-11-07T15:00:00Z'),
      customerName: 'Bob Johnson',
      customerPhone: '+81-90-2222-0002',
    },
  });

  await prisma.appointmentService.upsert({
    where: { id: SEED_IDS.apptServiceConfirmed },
    update: {},
    create: {
      id: SEED_IDS.apptServiceConfirmed,
      appointmentId: apptConfirmed.id,
      salonServiceId: coreServiceCut.id,
      staffId: coreTenantStaffYuki.id,
      price: '6500.00',
      duration: 60,
      status: 'confirmed',
    },
  });

  // Appointment 3: PENDING
  const apptPending = await prisma.appointment.upsert({
    where: { id: SEED_IDS.apptPending },
    update: {},
    create: {
      id: SEED_IDS.apptPending,
      salonTenantId: auth.tenantLumiere.id,
      customerId: auth.coreCustomerAlice.id,
      staffId: coreTenantStaffYuki.id,
      status: 'pending',
      startTime: new Date('2026-11-14T11:00:00Z'),
      endTime: new Date('2026-11-14T12:00:00Z'),
      customerName: 'Alice Morgan',
    },
  });

  await prisma.appointmentService.upsert({
    where: { id: SEED_IDS.apptServicePending },
    update: {},
    create: {
      id: SEED_IDS.apptServicePending,
      appointmentId: apptPending.id,
      salonServiceId: coreServiceCut.id,
      staffId: coreTenantStaffYuki.id,
      price: '6500.00',
      duration: 60,
      status: 'pending',
    },
  });

  // Appointment 4: CANCELLED
  const apptCancelled = await prisma.appointment.upsert({
    where: { id: SEED_IDS.apptCancelled },
    update: {},
    create: {
      id: SEED_IDS.apptCancelled,
      salonTenantId: auth.tenantLumiere.id,
      customerId: auth.coreCustomerBob.id,
      staffId: coreTenantStaffYuki.id,
      status: 'cancelled',
      startTime: new Date('2026-11-01T16:00:00Z'),
      endTime: new Date('2026-11-01T17:00:00Z'),
      cancelledAt: new Date('2026-10-31T09:00:00Z'),
      cancellationReason: 'Customer requested cancellation due to unexpected urgent travel.',
      customerName: 'Bob Johnson',
    },
  });

  await prisma.appointmentService.upsert({
    where: { id: SEED_IDS.apptServiceCancelled },
    update: {},
    create: {
      id: SEED_IDS.apptServiceCancelled,
      appointmentId: apptCancelled.id,
      salonServiceId: coreServiceCut.id,
      staffId: coreTenantStaffYuki.id,
      price: '6500.00',
      duration: 60,
      status: 'cancelled',
    },
  });

  // 4. Coupons & User Redemptions
  const couponWelcome = await prisma.coupon.upsert({
    where: { code: 'WELCOME20' },
    update: {},
    create: {
      id: SEED_IDS.couponWelcome,
      tenantId: auth.tenantLumiere.id,
      code: 'WELCOME20',
      description: '20% off your first appointment at Lumiere',
      discount: 20.0,
      discountType: 'PERCENT',
      maxDiscount: 2000,
      minPurchase: 5000,
      usageLimit: 100,
      validFrom: new Date('2026-01-01T00:00:00Z'),
      validTo: new Date('2027-01-01T00:00:00Z'),
    },
  });

  const couponVip = await prisma.coupon.upsert({
    where: { code: 'VIP1000' },
    update: {},
    create: {
      id: SEED_IDS.couponVip,
      tenantId: auth.tenantLumiere.id,
      code: 'VIP1000',
      description: '¥1,000 off exclusive VIP appreciation voucher',
      discount: 1000.0,
      discountType: 'FIXED',
      minPurchase: 4000,
      usageLimit: 50,
      validFrom: new Date('2026-01-01T00:00:00Z'),
      validTo: new Date('2027-01-01T00:00:00Z'),
    },
  });

  await prisma.userCoupon.upsert({
    where: { userId_couponId: { userId: auth.userCustomerAlice.id, couponId: couponVip.id } },
    update: {},
    create: {
      userId: auth.userCustomerAlice.id,
      couponId: couponVip.id,
      isUsed: true,
      usedAt: new Date('2026-10-15T11:00:00Z'),
    },
  });

  await prisma.userCoupon.upsert({
    where: { userId_couponId: { userId: auth.userCustomerBob.id, couponId: couponWelcome.id } },
    update: {},
    create: {
      userId: auth.userCustomerBob.id,
      couponId: couponWelcome.id,
      isUsed: false,
    },
  });

  console.log('  ✓ Seeded Leave Blocks, Appointments, Services, and Coupons');
}
