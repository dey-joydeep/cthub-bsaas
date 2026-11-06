import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient, RegistrationStatus, SalonOwnerStatus } from '@prisma/client';
import { UserRole } from '@cthub-bsaas/shared';
import * as bcrypt from 'bcryptjs';

// Automatically load environment variables for standalone execution
// Supports explicit test database targeting via --test or NODE_ENV=test
const isTestTarget = process.env['NODE_ENV'] === 'test' || process.argv.includes('--test') || Boolean(process.env['TEST_DATABASE_URL']);

if (isTestTarget && existsSync(resolve('.env.test'))) {
  process.loadEnvFile(resolve('.env.test'));
} else if (existsSync(resolve('.env.test')) && !existsSync(resolve('.env'))) {
  process.loadEnvFile(resolve('.env.test'));
} else if (existsSync(resolve('.env'))) {
  process.loadEnvFile(resolve('.env'));
}

if (!process.env['DATABASE_URL'] && process.env['TEST_DATABASE_URL']) {
  process.env['DATABASE_URL'] = process.env['TEST_DATABASE_URL'];
}

const prisma = new PrismaClient();

// Deterministic UUIDs for entities without natural unique constraints
const SEED_IDS = {
  addressLumiereShibuya: 'a0000001-0000-4000-a000-000000000001',
  addressLumiereShinjuku: 'a0000001-0000-4000-a000-000000000002',
  addressZenRoppongi: 'a0000001-0000-4000-a000-000000000003',
  addressSanFrancisco: 'a0000001-0000-4000-a000-000000000004',

  tenantLumiere: 'b0000001-0000-4000-a000-000000000001',
  tenantZen: 'b0000001-0000-4000-a000-000000000002',

  leaveGlobalAnnual: 'e0000001-0000-4000-a000-000000000001',
  leaveBranchTraining: 'e0000001-0000-4000-a000-000000000002',
  leaveHistoricalPast: 'e0000001-0000-4000-a000-000000000003',
  leaveFutureExam: 'e0000001-0000-4000-a000-000000000004',

  noteAliceAllergy: 'f0000001-0000-4000-a000-000000000001',
  noteAliceVipPref: 'f0000001-0000-4000-a000-000000000002',
  noteBobWalkIn: 'f0000001-0000-4000-a000-000000000003',

  coreSalonShibuya: 'c0000001-0000-4000-a000-000000000001',
  coreTenantStaffYuki: 'c0000002-0000-4000-a000-000000000001',
  coreCategoryHair: 'c0000003-0000-4000-a000-000000000001',
  coreServiceCut: 'c0000004-0000-4000-a000-000000000001',

  apptCompleted: 'd0000001-0000-4000-a000-000000000001',
  apptConfirmed: 'd0000001-0000-4000-a000-000000000002',
  apptPending: 'd0000001-0000-4000-a000-000000000003',
  apptCancelled: 'd0000001-0000-4000-a000-000000000004',

  apptServiceCompleted: 'd0000002-0000-4000-a000-000000000001',
  apptServiceConfirmed: 'd0000002-0000-4000-a000-000000000002',
  apptServicePending: 'd0000002-0000-4000-a000-000000000003',
  apptServiceCancelled: 'd0000002-0000-4000-a000-000000000004',

  couponWelcome: 'd0000004-0000-4000-a000-000000000001',
  couponVip: 'd0000004-0000-4000-a000-000000000002',
};

async function main() {
  const dbUrl = process.env['DATABASE_URL'] ?? '';
  let dbHost = 'unknown';
  let dbName = 'unknown';
  try {
    const parsed = new URL(dbUrl);
    dbHost = parsed.host;
    dbName = parsed.pathname.replace(/^\//, '');
  } catch {
    // fallback
  }

  console.log('===============================================================');
  console.log(' Starting CTHub Comprehensive Database Seeding...');
  console.log(` Target Database: ${dbName} on ${dbHost}`);
  console.log(` Target Profile:  ${dbName.includes('_test') ? 'TEST (Isolated Test DB)' : 'LOCAL (Development DB)'}`);
  console.log('===============================================================');

  // =========================================================================
  // 1. MASTER DATA: System Roles
  // =========================================================================
  console.log('\n[1/8] Seeding Master: System Roles...');
  const roleNames = Array.from(
    new Set([
      ...Object.values(UserRole),
      ...Object.values(UserRole).map((r) => r.toUpperCase()),
      'admin',
      'owner',
      'staff',
      'customer',
      'guest',
      'ADMIN',
      'OWNER',
      'STAFF',
      'CUSTOMER',
      'GUEST',
      'SUPER_ADMIN',
      'SALON_OWNER',
      'SALON_MANAGER',
      'SALON_STAFF',
    ]),
  );

  for (const name of roleNames) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`  ✓ Seeded ${roleNames.length} system role definitions (both standard & enum variants)`);

  // =========================================================================
  // 2. MASTER DATA: Geography (Country -> State -> City -> BusinessAddress)
  // =========================================================================
  console.log('\n[2/8] Seeding Master: Geography & Addresses...');
  const countryJapan = await prisma.country.upsert({
    where: { iso2: 'JP' },
    update: { name: 'Japan', iso3: 'JPN', phoneCode: '81', currency: 'JPY' },
    create: {
      name: 'Japan',
      iso2: 'JP',
      iso3: 'JPN',
      phoneCode: '81',
      currency: 'JPY',
      capital: 'Tokyo',
      isActive: true,
    },
  });

  const countryUSA = await prisma.country.upsert({
    where: { iso2: 'US' },
    update: { name: 'United States', iso3: 'USA', phoneCode: '1', currency: 'USD' },
    create: {
      name: 'United States',
      iso2: 'US',
      iso3: 'USA',
      phoneCode: '1',
      currency: 'USD',
      capital: 'Washington, D.C.',
      isActive: true,
    },
  });

  const stateTokyo = await prisma.state.upsert({
    where: { countryId_stateCode: { countryId: countryJapan.id, stateCode: '13' } },
    update: { name: 'Tokyo' },
    create: { countryId: countryJapan.id, stateCode: '13', name: 'Tokyo', isActive: true },
  });

  await prisma.state.upsert({
    where: { countryId_stateCode: { countryId: countryJapan.id, stateCode: '14' } },
    update: { name: 'Kanagawa' },
    create: { countryId: countryJapan.id, stateCode: '14', name: 'Kanagawa', isActive: true },
  });

  const stateCalifornia = await prisma.state.upsert({
    where: { countryId_stateCode: { countryId: countryUSA.id, stateCode: 'CA' } },
    update: { name: 'California' },
    create: { countryId: countryUSA.id, stateCode: 'CA', name: 'California', isActive: true },
  });

  const cityShibuya = await prisma.city.upsert({
    where: { countryId_stateId_name: { countryId: countryJapan.id, stateId: stateTokyo.id, name: 'Shibuya-ku' } },
    update: {},
    create: { countryId: countryJapan.id, stateId: stateTokyo.id, name: 'Shibuya-ku', isActive: true },
  });

  const cityShinjuku = await prisma.city.upsert({
    where: { countryId_stateId_name: { countryId: countryJapan.id, stateId: stateTokyo.id, name: 'Shinjuku-ku' } },
    update: {},
    create: { countryId: countryJapan.id, stateId: stateTokyo.id, name: 'Shinjuku-ku', isActive: true },
  });

  const cityMinato = await prisma.city.upsert({
    where: { countryId_stateId_name: { countryId: countryJapan.id, stateId: stateTokyo.id, name: 'Minato-ku' } },
    update: {},
    create: { countryId: countryJapan.id, stateId: stateTokyo.id, name: 'Minato-ku', isActive: true },
  });

  await prisma.city.upsert({
    where: { countryId_stateId_name: { countryId: countryUSA.id, stateId: stateCalifornia.id, name: 'San Francisco' } },
    update: {},
    create: { countryId: countryUSA.id, stateId: stateCalifornia.id, name: 'San Francisco', isActive: true },
  });

  const addressShibuya = await prisma.businessAddress.upsert({
    where: { id: SEED_IDS.addressLumiereShibuya },
    update: {},
    create: {
      id: SEED_IDS.addressLumiereShibuya,
      countryId: countryJapan.id,
      stateId: stateTokyo.id,
      cityId: cityShibuya.id,
      postalCode: '150-0001',
      line1: 'Jingumae 5-10-1',
      line2: 'Suite 301',
      buildingName: 'Omotesando Hills Annex',
      latitude: 35.6653,
      longitude: 139.7123,
      isActive: true,
    },
  });

  await prisma.businessAddress.upsert({
    where: { id: SEED_IDS.addressLumiereShinjuku },
    update: {},
    create: {
      id: SEED_IDS.addressLumiereShinjuku,
      countryId: countryJapan.id,
      stateId: stateTokyo.id,
      cityId: cityShinjuku.id,
      postalCode: '160-0022',
      line1: 'Shinjuku 3-25-1',
      buildingName: 'Lumiere Shinjuku Studio Bldg',
      latitude: 35.6917,
      longitude: 139.7042,
      isActive: true,
    },
  });

  const addressZen = await prisma.businessAddress.upsert({
    where: { id: SEED_IDS.addressZenRoppongi },
    update: {},
    create: {
      id: SEED_IDS.addressZenRoppongi,
      countryId: countryJapan.id,
      stateId: stateTokyo.id,
      cityId: cityMinato.id,
      postalCode: '106-0032',
      line1: 'Roppongi 6-10-1',
      buildingName: 'Mori Tower Level 4',
      latitude: 35.6605,
      longitude: 139.7292,
      isActive: true,
    },
  });
  console.log('  ✓ Seeded Countries, States, Cities, and Business Addresses');

  // =========================================================================
  // 3. MASTER DATA: Users & Authentication (Admin, Owners, Staff, Customers)
  // =========================================================================
  console.log('\n[3/8] Seeding Master: Users & Authentication...');
  const defaultPasswordHash = bcrypt.hashSync('Password123!', 10);

  // Helper to upsert a user with assigned roles
  async function seedUser(email: string, name: string, roleIdentifiers: string[]) {
    const user = await prisma.user.upsert({
      where: { email },
      update: { name, passwordHash: defaultPasswordHash, isVerified: true },
      create: {
        email,
        name,
        passwordHash: defaultPasswordHash,
        isVerified: true,
        registrationStatus: RegistrationStatus.COMPLETED,
        emailVerifiedAt: new Date(),
        isActive: true,
      },
    });

    for (const roleId of roleIdentifiers) {
      const roleRecord = await prisma.role.findFirst({
        where: {
          OR: [{ name: roleId }, { name: roleId.toUpperCase() }, { name: roleId.toLowerCase() }],
        },
      });

      if (roleRecord) {
        await prisma.userRole.upsert({
          where: { userId_roleId: { userId: user.id, roleId: roleRecord.id } },
          update: {},
          create: { userId: user.id, roleId: roleRecord.id },
        });
      }
    }

    return user;
  }

  const userAdmin = await seedUser('admin@cthub-bsaas.com', 'CTHub SaaS Administrator', ['admin', 'SUPER_ADMIN']);
  await prisma.saasOwner.upsert({
    where: { userId: userAdmin.id },
    update: {},
    create: { userId: userAdmin.id, permissions: ['ALL_PERMISSIONS'], managedTenants: [] },
  });

  const userOwnerLumiere = await seedUser('owner.lumiere@example.com', 'Elena Vance (Owner)', ['owner', 'SALON_OWNER']);
  await seedUser('owner.zen@example.com', 'Master Jin (Barber Owner)', ['owner', 'SALON_OWNER']);
  await seedUser('manager.kenji@example.com', 'Kenji Sato (Manager)', ['staff', 'SALON_MANAGER']);
  const userStylistYuki = await seedUser('stylist.yuki@example.com', 'Yuki Tanaka (Senior Stylist)', ['staff', 'SALON_STAFF']);
  await seedUser('stylist.ren@example.com', 'Ren Takahashi (Junior Stylist)', ['staff', 'SALON_STAFF']);
  const userCustomerAlice = await seedUser('customer.alice@example.com', 'Alice Morgan', ['customer']);
  const userCustomerBob = await seedUser('customer.bob@example.com', 'Bob Johnson', ['customer']);

  // Seed core Customer profiles (setting customer.id = user.id satisfies compound relation)
  const coreCustomerAlice = await prisma.customer.upsert({
    where: { userId: userCustomerAlice.id },
    update: {},
    create: {
      id: userCustomerAlice.id,
      userId: userCustomerAlice.id,
      phone: '+81-90-2222-0001',
      dateOfBirth: new Date('1992-05-14'),
      gender: 'FEMALE',
      address: 'Jingumae 3-4-5',
      city: 'Shibuya',
      state: 'Tokyo',
      country: 'Japan',
      postalCode: '150-0001',
      loyaltyPoints: 350,
      isActive: true,
    },
  });

  const coreCustomerBob = await prisma.customer.upsert({
    where: { userId: userCustomerBob.id },
    update: {},
    create: {
      id: userCustomerBob.id,
      userId: userCustomerBob.id,
      phone: '+81-90-2222-0002',
      gender: 'MALE',
      loyaltyPoints: 50,
      isActive: true,
    },
  });
  console.log('  ✓ Seeded Users (Admin, Owners, Managers, Stylists, Customers) and Core Customer profiles');

  // =========================================================================
  // 4. MASTER DATA: Multi-Tenant Organizations & Salon Businesses
  // =========================================================================
  console.log('\n[4/8] Seeding Master: Salon Tenants & Businesses...');
  const tenantLumiere = await prisma.salonTenant.upsert({
    where: { id: SEED_IDS.tenantLumiere },
    update: {},
    create: {
      id: SEED_IDS.tenantLumiere,
      name: 'Lumière Hair & Beauty Group',
      email: 'contact@lumiere-salon.jp',
      phone: '+81-3-5555-0100',
      businessAddressId: addressShibuya.id,
      primaryColor: '#8B5CF6',
      secondaryColor: '#EC4899',
      accentColor: '#F59E0B',
    },
  });

  const tenantZen = await prisma.salonTenant.upsert({
    where: { id: SEED_IDS.tenantZen },
    update: {},
    create: {
      id: SEED_IDS.tenantZen,
      name: 'Tokyo Zen Barber & Grooming',
      email: 'info@zen-barber.jp',
      phone: '+81-3-5555-0200',
      businessAddressId: addressZen.id,
      primaryColor: '#1E293B',
      secondaryColor: '#64748B',
      accentColor: '#0EA5E9',
    },
  });

  const businessLumiere = await prisma.salonBusiness.upsert({
    where: { tenantId_displayName: { tenantId: tenantLumiere.id, displayName: 'Lumière Salon Group' } },
    update: {},
    create: {
      tenantId: tenantLumiere.id,
      displayName: 'Lumière Salon Group',
      legalName: 'Lumière Beauty Partners K.K.',
      status: SalonOwnerStatus.ACTIVE,
    },
  });

  await prisma.salonBusiness.upsert({
    where: { tenantId_displayName: { tenantId: tenantZen.id, displayName: 'Tokyo Zen Barber' } },
    update: {},
    create: {
      tenantId: tenantZen.id,
      displayName: 'Tokyo Zen Barber',
      legalName: 'Zen Grooming LLC',
      status: SalonOwnerStatus.ACTIVE,
    },
  });
  console.log('  ✓ Seeded Salon Tenants and Salon Businesses');

  // =========================================================================
  // 5. MASTER DATA: Branches, Hours, Holidays, and Policies
  // =========================================================================
  console.log('\n[5/8] Seeding Master: Branches, Hours, Holidays & Policies...');
  const branchShibuya = await prisma.salonBranch.upsert({
    where: { businessId_name: { businessId: businessLumiere.id, name: 'Lumière Shibuya Flagship' } },
    update: {},
    create: {
      businessId: businessLumiere.id,
      name: 'Lumière Shibuya Flagship',
      phone: '+81-3-5555-0101',
      email: 'shibuya@lumiere-salon.jp',
      timezone: 'Asia/Tokyo',
      currency: 'JPY',
      currencyLockedAt: new Date('2026-01-01T00:00:00Z'),
      status: SalonOwnerStatus.ACTIVE,
      address: {
        postalCode: '150-0001',
        prefecture: 'Tokyo',
        city: 'Shibuya-ku',
        addressLine1: 'Jingumae 5-10-1 Suite 301',
        buildingName: 'Omotesando Hills Annex',
      },
    },
  });

  const branchShinjuku = await prisma.salonBranch.upsert({
    where: { businessId_name: { businessId: businessLumiere.id, name: 'Lumière Shinjuku Studio' } },
    update: {},
    create: {
      businessId: businessLumiere.id,
      name: 'Lumière Shinjuku Studio',
      phone: '+81-3-5555-0102',
      email: 'shinjuku@lumiere-salon.jp',
      timezone: 'Asia/Tokyo',
      currency: 'JPY',
      currencyLockedAt: new Date('2026-01-01T00:00:00Z'),
      status: SalonOwnerStatus.ACTIVE,
      address: {
        postalCode: '160-0022',
        prefecture: 'Tokyo',
        city: 'Shinjuku-ku',
        addressLine1: 'Shinjuku 3-25-1',
        buildingName: 'Lumiere Shinjuku Studio Bldg',
      },
    },
  });

  await prisma.salonBranch.upsert({
    where: { businessId_name: { businessId: businessLumiere.id, name: 'Lumière Yokohama Outpost' } },
    update: {},
    create: {
      businessId: businessLumiere.id,
      name: 'Lumière Yokohama Outpost',
      phone: '+81-45-555-0103',
      timezone: 'Asia/Tokyo',
      currency: 'JPY',
      status: SalonOwnerStatus.INACTIVE, // Inactive branch for testing edge cases
      address: {
        postalCode: '220-0012',
        prefecture: 'Kanagawa',
        city: 'Yokohama',
        addressLine1: 'Minatomirai 1-1',
      },
    },
  });

  // Seed standard weekly hours for Shibuya Flagship (0: Sun to 6: Sat; Tuesday closed)
  const shibuyaWeeklyHours = [
    { dayOfWeek: 0, open: true, intervals: [{ start: '10:00', end: '18:00' }] },
    { dayOfWeek: 1, open: true, intervals: [{ start: '09:00', end: '20:00' }] },
    { dayOfWeek: 2, open: false, intervals: [] }, // Regular closed day
    { dayOfWeek: 3, open: true, intervals: [{ start: '09:00', end: '20:00' }] },
    { dayOfWeek: 4, open: true, intervals: [{ start: '09:00', end: '20:00' }] },
    { dayOfWeek: 5, open: true, intervals: [{ start: '09:00', end: '21:00' }] }, // Extended Friday
    { dayOfWeek: 6, open: true, intervals: [{ start: '10:00', end: '19:00' }] },
  ];

  for (const h of shibuyaWeeklyHours) {
    await prisma.salonBranchHours.upsert({
      where: { branchId_dayOfWeek: { branchId: branchShibuya.id, dayOfWeek: h.dayOfWeek } },
      update: { open: h.open, intervals: h.intervals },
      create: {
        branchId: branchShibuya.id,
        timezone: 'Asia/Tokyo',
        dayOfWeek: h.dayOfWeek,
        open: h.open,
        intervals: h.intervals,
      },
    });
  }

  // Branch Holidays: Full New Year closure & Partial holiday
  await prisma.salonBranchHoliday.upsert({
    where: { branchId_date: { branchId: branchShibuya.id, date: new Date('2026-01-01') } },
    update: {},
    create: {
      branchId: branchShibuya.id,
      date: new Date('2026-01-01'),
      closed: true,
      reason: "New Year's Day Closure",
      intervals: [],
    },
  });

  await prisma.salonBranchHoliday.upsert({
    where: { branchId_date: { branchId: branchShibuya.id, date: new Date('2026-05-04') } },
    update: {},
    create: {
      branchId: branchShibuya.id,
      date: new Date('2026-05-04'),
      closed: false,
      reason: 'Golden Week Holiday Schedule',
      intervals: [{ start: '11:00', end: '17:00' }],
    },
  });

  // Branch Policies
  await prisma.salonBranchPolicy.upsert({
    where: { branchId: branchShibuya.id },
    update: {},
    create: {
      branchId: branchShibuya.id,
      bookingLeadMinutes: 60,
      cancellationCutoffMinutes: 120,
      noShowGraceMinutes: 15,
    },
  });

  await prisma.salonBranchPolicy.upsert({
    where: { branchId: branchShinjuku.id },
    update: {},
    create: {
      branchId: branchShinjuku.id,
      bookingLeadMinutes: 30,
      cancellationCutoffMinutes: 60,
      noShowGraceMinutes: 10,
    },
  });
  console.log('  ✓ Seeded Salon Branches, Weekly Hours, Holidays & Policies');

  // =========================================================================
  // 6. MASTER DATA: Service Catalog (Categories & Services)
  // =========================================================================
  console.log('\n[6/8] Seeding Master: Service Catalog (Categories & Services)...');
  const catHaircut = await prisma.salonOwnerServiceCategory.upsert({
    where: { businessId_name: { businessId: businessLumiere.id, name: 'Haircuts & Styling' } },
    update: { sortOrder: 1 },
    create: { businessId: businessLumiere.id, name: 'Haircuts & Styling', sortOrder: 1 },
  });

  const catColor = await prisma.salonOwnerServiceCategory.upsert({
    where: { businessId_name: { businessId: businessLumiere.id, name: 'Hair Coloring & Highlights' } },
    update: { sortOrder: 2 },
    create: { businessId: businessLumiere.id, name: 'Hair Coloring & Highlights', sortOrder: 2 },
  });

  const catSpa = await prisma.salonOwnerServiceCategory.upsert({
    where: { businessId_name: { businessId: businessLumiere.id, name: 'Treatments & Head Spa' } },
    update: { sortOrder: 3 },
    create: { businessId: businessLumiere.id, name: 'Treatments & Head Spa', sortOrder: 3 },
  });

  const srvSignatureCut = await prisma.salonOwnerService.upsert({
    where: {
      businessId_categoryId_name: { businessId: businessLumiere.id, categoryId: catHaircut.id, name: 'Signature Haircut & Styling' },
    },
    update: {},
    create: {
      businessId: businessLumiere.id,
      categoryId: catHaircut.id,
      name: 'Signature Haircut & Styling',
      durationMinutes: 60,
      bufferMinutes: 15,
      basePrice: '6500.00',
      taxRatePercent: '10.00',
      status: SalonOwnerStatus.ACTIVE,
    },
  });

  const srvExpressCut = await prisma.salonOwnerService.upsert({
    where: { businessId_categoryId_name: { businessId: businessLumiere.id, categoryId: catHaircut.id, name: 'Express Dry Cut' } },
    update: {},
    create: {
      businessId: businessLumiere.id,
      categoryId: catHaircut.id,
      name: 'Express Dry Cut',
      durationMinutes: 30,
      bufferMinutes: 0,
      basePrice: '4000.00',
      taxRatePercent: '10.00',
      status: SalonOwnerStatus.ACTIVE,
    },
  });

  const srvBalayage = await prisma.salonOwnerService.upsert({
    where: { businessId_categoryId_name: { businessId: businessLumiere.id, categoryId: catColor.id, name: 'Full Balayage & Glossing' } },
    update: {},
    create: {
      businessId: businessLumiere.id,
      categoryId: catColor.id,
      name: 'Full Balayage & Glossing',
      durationMinutes: 120,
      bufferMinutes: 30,
      basePrice: '18000.00',
      taxRatePercent: '10.00',
      status: SalonOwnerStatus.ACTIVE,
    },
  });

  const srvHeadSpa = await prisma.salonOwnerService.upsert({
    where: { businessId_categoryId_name: { businessId: businessLumiere.id, categoryId: catSpa.id, name: 'Japanese Scalp Detox Spa' } },
    update: {},
    create: {
      businessId: businessLumiere.id,
      categoryId: catSpa.id,
      name: 'Japanese Scalp Detox Spa',
      durationMinutes: 45,
      bufferMinutes: 15,
      basePrice: '8000.00',
      taxRatePercent: '10.00',
      status: SalonOwnerStatus.ACTIVE,
    },
  });

  await prisma.salonOwnerService.upsert({
    where: {
      businessId_categoryId_name: {
        businessId: businessLumiere.id,
        categoryId: catColor.id,
        name: 'Seasonal Summer Sun Highlights (Archived)',
      },
    },
    update: {},
    create: {
      businessId: businessLumiere.id,
      categoryId: catColor.id,
      name: 'Seasonal Summer Sun Highlights (Archived)',
      durationMinutes: 60,
      bufferMinutes: 0,
      basePrice: '7000.00',
      taxRatePercent: '10.00',
      status: SalonOwnerStatus.INACTIVE, // Inactive service edge case
    },
  });
  console.log('  ✓ Seeded Service Categories and Services (Active, Buffers, Pricing & Archived)');

  // =========================================================================
  // 7. MASTER DATA: Staff, Roles, Branch Assignments, Skills & Shifts
  // =========================================================================
  console.log('\n[7/8] Seeding Master: Staff, Roles, Branch Assignments, Skills & Shifts...');
  // Staff 1: Elena Vance (Co-Owner & Master Stylist - Multi-branch floating)
  const staffElena = await prisma.salonOwnerStaff.upsert({
    where: { businessId_phone: { businessId: businessLumiere.id, phone: '+81-90-1111-0001' } },
    update: { roles: ['OWNER', 'STYLIST'] },
    create: {
      businessId: businessLumiere.id,
      displayName: 'Elena Vance',
      phone: '+81-90-1111-0001',
      email: 'owner.lumiere@example.com',
      roles: ['OWNER', 'STYLIST'],
      status: SalonOwnerStatus.ACTIVE,
    },
  });

  // Staff 2: Kenji Sato (Manager - Single branch)
  const staffKenji = await prisma.salonOwnerStaff.upsert({
    where: { businessId_phone: { businessId: businessLumiere.id, phone: '+81-90-1111-0002' } },
    update: { roles: ['MANAGER'] },
    create: {
      businessId: businessLumiere.id,
      displayName: 'Kenji Sato',
      phone: '+81-90-1111-0002',
      email: 'manager.kenji@example.com',
      roles: ['MANAGER'],
      status: SalonOwnerStatus.ACTIVE,
    },
  });

  // Staff 3: Yuki Tanaka (Senior Stylist - Shibuya Flagship)
  const staffYuki = await prisma.salonOwnerStaff.upsert({
    where: { businessId_phone: { businessId: businessLumiere.id, phone: '+81-90-1111-0003' } },
    update: { roles: ['STYLIST'] },
    create: {
      businessId: businessLumiere.id,
      displayName: 'Yuki Tanaka',
      phone: '+81-90-1111-0003',
      email: 'stylist.yuki@example.com',
      roles: ['STYLIST'],
      status: SalonOwnerStatus.ACTIVE,
    },
  });

  // Staff 4: Ren Takahashi (Junior Stylist - Shinjuku Studio)
  const staffRen = await prisma.salonOwnerStaff.upsert({
    where: { businessId_phone: { businessId: businessLumiere.id, phone: '+81-90-1111-0004' } },
    update: { roles: ['STYLIST'] },
    create: {
      businessId: businessLumiere.id,
      displayName: 'Ren Takahashi',
      phone: '+81-90-1111-0004',
      email: 'stylist.ren@example.com',
      roles: ['STYLIST'],
      status: SalonOwnerStatus.ACTIVE,
    },
  });

  // Staff 5: Mio Suzuki (Front Desk Receptionist & Cashier)
  const staffMio = await prisma.salonOwnerStaff.upsert({
    where: { businessId_phone: { businessId: businessLumiere.id, phone: '+81-90-1111-0005' } },
    update: { roles: ['RECEPTIONIST', 'CASHIER'] },
    create: {
      businessId: businessLumiere.id,
      displayName: 'Mio Suzuki',
      phone: '+81-90-1111-0005',
      email: 'mio.suzuki@example.com',
      roles: ['RECEPTIONIST', 'CASHIER'],
      status: SalonOwnerStatus.ACTIVE,
    },
  });

  // Staff 6: Inactive Stylist for testing filtering
  const staffInactive = await prisma.salonOwnerStaff.upsert({
    where: { businessId_phone: { businessId: businessLumiere.id, phone: '+81-90-1111-0006' } },
    update: { status: SalonOwnerStatus.INACTIVE },
    create: {
      businessId: businessLumiere.id,
      displayName: 'Taro Yamada (Inactive)',
      phone: '+81-90-1111-0006',
      roles: ['STYLIST'],
      status: SalonOwnerStatus.INACTIVE,
    },
  });

  // Branch Assignments
  const branchAssignments = [
    { staffId: staffElena.id, branchId: branchShibuya.id },
    { staffId: staffElena.id, branchId: branchShinjuku.id }, // Floating across two branches
    { staffId: staffKenji.id, branchId: branchShibuya.id },
    { staffId: staffYuki.id, branchId: branchShibuya.id },
    { staffId: staffRen.id, branchId: branchShinjuku.id },
    { staffId: staffMio.id, branchId: branchShibuya.id },
    { staffId: staffInactive.id, branchId: branchShibuya.id },
  ];

  for (const a of branchAssignments) {
    await prisma.salonOwnerStaffBranch.upsert({
      where: { staffId_branchId: { staffId: a.staffId, branchId: a.branchId } },
      update: {},
      create: { staffId: a.staffId, branchId: a.branchId },
    });
  }

  // Canonical Skills Mapping (Single source of truth per ADR 0005)
  const skillMappings = [
    // Elena has all skills
    { staffId: staffElena.id, serviceId: srvSignatureCut.id },
    { staffId: staffElena.id, serviceId: srvExpressCut.id },
    { staffId: staffElena.id, serviceId: srvBalayage.id },
    { staffId: staffElena.id, serviceId: srvHeadSpa.id },
    // Yuki: Senior Stylist (Cuts, Color, Spa)
    { staffId: staffYuki.id, serviceId: srvSignatureCut.id },
    { staffId: staffYuki.id, serviceId: srvBalayage.id },
    { staffId: staffYuki.id, serviceId: srvHeadSpa.id },
    // Ren: Junior Stylist (Express dry cuts only)
    { staffId: staffRen.id, serviceId: srvExpressCut.id },
  ];

  for (const s of skillMappings) {
    await prisma.salonOwnerStaffSkill.upsert({
      where: { staffId_serviceId: { staffId: s.staffId, serviceId: s.serviceId } },
      update: {},
      create: { staffId: s.staffId, serviceId: s.serviceId },
    });
  }

  // Staff Shifts (Weekly shifts)
  await prisma.salonOwnerStaffShift.upsert({
    where: { staffId_branchId: { staffId: staffYuki.id, branchId: branchShibuya.id } },
    update: {},
    create: {
      staffId: staffYuki.id,
      branchId: branchShibuya.id,
      timezone: 'Asia/Tokyo',
      days: [
        { dayOfWeek: 3, intervals: [{ start: '10:00', end: '19:00' }] },
        { dayOfWeek: 4, intervals: [{ start: '10:00', end: '19:00' }] },
        { dayOfWeek: 5, intervals: [{ start: '10:00', end: '19:00' }] },
        { dayOfWeek: 6, intervals: [{ start: '10:00', end: '18:00' }] },
      ],
    },
  });

  await prisma.salonOwnerStaffShift.upsert({
    where: { staffId_branchId: { staffId: staffRen.id, branchId: branchShinjuku.id } },
    update: {},
    create: {
      staffId: staffRen.id,
      branchId: branchShinjuku.id,
      timezone: 'Asia/Tokyo',
      days: [
        { dayOfWeek: 1, intervals: [{ start: '09:00', end: '17:00' }] },
        { dayOfWeek: 2, intervals: [{ start: '09:00', end: '17:00' }] },
        { dayOfWeek: 3, intervals: [{ start: '09:00', end: '17:00' }] },
        { dayOfWeek: 4, intervals: [{ start: '09:00', end: '17:00' }] },
      ],
    },
  });

  // Customers CRM records
  const custAlice = await prisma.salonOwnerCustomer.upsert({
    where: { businessId_phone: { businessId: businessLumiere.id, phone: '+81-90-2222-0001' } },
    update: {},
    create: {
      businessId: businessLumiere.id,
      displayName: 'Alice Morgan',
      phone: '+81-90-2222-0001',
      email: 'customer.alice@example.com',
      dateOfBirth: new Date('1992-05-14'),
      consentForMarketing: true,
      smsEnabled: true,
      emailEnabled: true,
      whatsappEnabled: true,
    },
  });

  const custBob = await prisma.salonOwnerCustomer.upsert({
    where: { businessId_phone: { businessId: businessLumiere.id, phone: '+81-90-2222-0002' } },
    update: {},
    create: {
      businessId: businessLumiere.id,
      displayName: 'Bob Johnson',
      phone: '+81-90-2222-0002',
      consentForMarketing: false,
      smsEnabled: false,
      emailEnabled: false,
      whatsappEnabled: false,
    },
  });
  console.log('  ✓ Seeded Staff, Multi-branch Assignments, Skills, Shifts, and CRM Customers');

  // =========================================================================
  // 8. TRANSACTION DATA: Leave Blocks, Customer Notes, Appointments & Coupons
  // =========================================================================
  console.log('\n[8/8] Seeding Transactions: Staff Leave Blocks, Notes, Appointments, Coupons...');

  // 8.1 Staff Leave Blocks (Testing: Salon-wide vs Branch-specific, Past vs Future)
  // Combination 1: Salon-wide leave (branchId: null)
  await prisma.salonOwnerStaffLeaveBlock.upsert({
    where: { id: SEED_IDS.leaveGlobalAnnual },
    update: {},
    create: {
      id: SEED_IDS.leaveGlobalAnnual,
      staffId: staffYuki.id,
      branchId: null, // Global business-wide leave
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
      staffId: staffElena.id,
      branchId: branchShibuya.id, // Only unavailable at Shibuya; still active elsewhere
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
      staffId: staffYuki.id,
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
      staffId: staffRen.id,
      branchId: branchShinjuku.id,
      startsAt: new Date('2027-01-15T09:00:00Z'),
      endsAt: new Date('2027-01-18T18:00:00Z'),
      reason: 'Advanced Cosmetology Licensing Exam',
    },
  });

  // 8.2 Customer CRM Notes
  await prisma.salonOwnerCustomerNote.upsert({
    where: { id: SEED_IDS.noteAliceAllergy },
    update: {},
    create: {
      id: SEED_IDS.noteAliceAllergy,
      customerId: custAlice.id,
      body: 'Allergic to ammonia-based hair bleach. Must use 100% organic vegan dye formulation and conduct patch test.',
      visibility: 'STAFF_ONLY',
      createdAt: new Date('2026-09-01T10:00:00Z'),
    },
  });

  await prisma.salonOwnerCustomerNote.upsert({
    where: { id: SEED_IDS.noteAliceVipPref },
    update: {},
    create: {
      id: SEED_IDS.noteAliceVipPref,
      customerId: custAlice.id,
      body: 'VIP client. Prefers quiet appointments with green tea or sparkling water. Loves thorough scalp massage.',
      visibility: 'GENERAL',
      createdAt: new Date('2026-09-15T14:30:00Z'),
    },
  });

  await prisma.salonOwnerCustomerNote.upsert({
    where: { id: SEED_IDS.noteBobWalkIn },
    update: {},
    create: {
      id: SEED_IDS.noteBobWalkIn,
      customerId: custBob.id,
      body: 'Walk-in customer. Prefers short fades. Prompt in and out within 30 minutes.',
      visibility: 'GENERAL',
      createdAt: new Date('2026-10-05T16:00:00Z'),
    },
  });

  // 8.3 Core Salon, Core Service, and Staff Linkage for Core Appointments
  const coreSalon = await prisma.salon.upsert({
    where: { slug: 'lumiere-shibuya-flagship' },
    update: {},
    create: {
      id: SEED_IDS.coreSalonShibuya,
      tenantId: tenantLumiere.id,
      businessAddressId: addressShibuya.id,
      name: 'Lumière Shibuya Flagship Salon',
      slug: 'lumiere-shibuya-flagship',
      ownerId: userOwnerLumiere.id,
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
      userId: userStylistYuki.id,
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

  // 8.4 Appointments & Services (Completed, Confirmed, Pending, Cancelled)
  // Appointment 1: COMPLETED (in the past)
  const apptCompleted = await prisma.appointment.upsert({
    where: { id: SEED_IDS.apptCompleted },
    update: {},
    create: {
      id: SEED_IDS.apptCompleted,
      salonTenantId: tenantLumiere.id,
      customerId: coreCustomerAlice.id,
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

  // Appointment 2: CONFIRMED (upcoming tomorrow)
  const apptConfirmed = await prisma.appointment.upsert({
    where: { id: SEED_IDS.apptConfirmed },
    update: {},
    create: {
      id: SEED_IDS.apptConfirmed,
      salonTenantId: tenantLumiere.id,
      customerId: coreCustomerBob.id,
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

  // Appointment 3: PENDING (next week)
  const apptPending = await prisma.appointment.upsert({
    where: { id: SEED_IDS.apptPending },
    update: {},
    create: {
      id: SEED_IDS.apptPending,
      salonTenantId: tenantLumiere.id,
      customerId: coreCustomerAlice.id,
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

  // Appointment 4: CANCELLED (with cancellation reason)
  const apptCancelled = await prisma.appointment.upsert({
    where: { id: SEED_IDS.apptCancelled },
    update: {},
    create: {
      id: SEED_IDS.apptCancelled,
      salonTenantId: tenantLumiere.id,
      customerId: coreCustomerBob.id,
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

  // 8.5 Coupons & User Redemptions
  const couponWelcome = await prisma.coupon.upsert({
    where: { code: 'WELCOME20' },
    update: {},
    create: {
      id: SEED_IDS.couponWelcome,
      tenantId: tenantLumiere.id,
      code: 'WELCOME20',
      description: '20% off your first appointment at Lumiere',
      discount: 20.0,
      discountType: 'PERCENT',
      maxDiscount: 2000,
      minPurchase: 5000,
      usageLimit: 100,
    },
  });

  const couponVip = await prisma.coupon.upsert({
    where: { code: 'VIP1000' },
    update: {},
    create: {
      id: SEED_IDS.couponVip,
      tenantId: tenantLumiere.id,
      code: 'VIP1000',
      description: '¥1,000 off exclusive VIP appreciation voucher',
      discount: 1000.0,
      discountType: 'FIXED',
      minPurchase: 4000,
      usageLimit: 50,
    },
  });

  // UserCoupon: Alice redeemed VIP1000, Bob claimed WELCOME20
  await prisma.userCoupon.upsert({
    where: { userId_couponId: { userId: userCustomerAlice.id, couponId: couponVip.id } },
    update: {},
    create: {
      userId: userCustomerAlice.id,
      couponId: couponVip.id,
      isUsed: true,
      usedAt: new Date('2026-10-15T11:00:00Z'),
    },
  });

  await prisma.userCoupon.upsert({
    where: { userId_couponId: { userId: userCustomerBob.id, couponId: couponWelcome.id } },
    update: {},
    create: {
      userId: userCustomerBob.id,
      couponId: couponWelcome.id,
      isUsed: false,
    },
  });
  console.log('  ✓ Seeded Leave Blocks (Global vs Branch), CRM Notes, Core Appointments, and Coupons');

  console.log('\n===============================================================');
  console.log(' CTHub Database Seeding Completed Successfully!');
  console.log(' Summary of Master & Transactional Data:');
  console.log(' - 14 System Roles & Aliases');
  console.log(' - 2 Countries, 3 States, 4 Cities, 3 Business Addresses');
  console.log(' - 7 Users (1 Admin, 2 Owners, 1 Manager, 2 Stylists, 2 Customers)');
  console.log(' - 2 Salon Tenants, 2 Salon Businesses');
  console.log(' - 3 Salon Branches, 7 Daily Hours, 2 Holidays, 2 Policies');
  console.log(' - 3 Service Categories, 5 Services (Active, Buffers, Inactive)');
  console.log(' - 6 Staff Profiles, Multi-branch Assignments, Skills & Shifts');
  console.log(' - 2 CRM Customer Profiles');
  console.log(' - 4 Staff Leave Blocks (Salon-wide, Branch-specific, Past, Future)');
  console.log(' - 3 Customer Clinical/VIP Notes');
  console.log(' - 4 Appointments (Completed, Confirmed, Pending, Cancelled)');
  console.log(' - 2 Promotional Coupons & User Redemptions');
  console.log('===============================================================\n');
}

main()
  .catch((e) => {
    console.error('\n❌ Seeding failed with error:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
