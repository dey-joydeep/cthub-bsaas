import { SalonOwnerStatus } from '@prisma/client';
import { cloneDefaultRolesForBusiness } from '../../src/lib/role-defaults';
import type { AuthSeedResult } from './03-auth-tenants.seed';
import type { SeedContext } from './seed-context';

export interface SalonBranchesSeedResult {
  readonly businessLumiere: { id: string; displayName: string };
  readonly businessZen: { id: string; displayName: string };
  readonly branchShibuya: { id: string; name: string };
  readonly branchShinjuku: { id: string; name: string };
}

export async function seedSalonAndBranches(context: SeedContext, auth: AuthSeedResult): Promise<SalonBranchesSeedResult> {
  const { prisma } = context;

  console.log('\n[4/7] Seeding Salon Businesses, Cloned Roles & Branches...');

  const businessLumiere = await prisma.salonBusiness.upsert({
    where: { tenantId_displayName: { tenantId: auth.tenantLumiere.id, displayName: 'Lumière Salon Group' } },
    update: {},
    create: {
      tenantId: auth.tenantLumiere.id,
      displayName: 'Lumière Salon Group',
      legalName: 'Lumière Beauty Partners K.K.',
      status: SalonOwnerStatus.ACTIVE,
    },
  });

  const businessZen = await prisma.salonBusiness.upsert({
    where: { tenantId_displayName: { tenantId: auth.tenantZen.id, displayName: 'Tokyo Zen Barber' } },
    update: {},
    create: {
      tenantId: auth.tenantZen.id,
      displayName: 'Tokyo Zen Barber',
      legalName: 'Zen Grooming LLC',
      status: SalonOwnerStatus.ACTIVE,
    },
  });

  // ADR-0005: Clone presets into business semi-master
  await cloneDefaultRolesForBusiness(prisma, businessLumiere.id);
  await cloneDefaultRolesForBusiness(prisma, businessZen.id);
  console.log('  ✓ Cloned Role Master Presets for Businesses (ADR-0005)');

  // Branches
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
      status: SalonOwnerStatus.INACTIVE,
      address: {
        postalCode: '220-0012',
        prefecture: 'Kanagawa',
        city: 'Yokohama',
        addressLine1: 'Minatomirai 1-1',
      },
    },
  });

  // Seed weekly hours for Shibuya Flagship (0: Sun to 6: Sat; Tuesday closed)
  const shibuyaWeeklyHours = [
    { dayOfWeek: 0, open: true, intervals: [{ start: '10:00', end: '18:00' }] },
    { dayOfWeek: 1, open: true, intervals: [{ start: '09:00', end: '20:00' }] },
    { dayOfWeek: 2, open: false, intervals: [] },
    { dayOfWeek: 3, open: true, intervals: [{ start: '09:00', end: '20:00' }] },
    { dayOfWeek: 4, open: true, intervals: [{ start: '09:00', end: '20:00' }] },
    { dayOfWeek: 5, open: true, intervals: [{ start: '09:00', end: '21:00' }] },
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

  // Branch Holidays
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

  console.log('  ✓ Seeded Salon Businesses, Branches, Hours, Holidays & Policies');

  return {
    businessLumiere: { id: businessLumiere.id, displayName: businessLumiere.displayName },
    businessZen: { id: businessZen.id, displayName: businessZen.displayName },
    branchShibuya: { id: branchShibuya.id, name: branchShibuya.name },
    branchShinjuku: { id: branchShinjuku.id, name: branchShinjuku.name },
  };
}
