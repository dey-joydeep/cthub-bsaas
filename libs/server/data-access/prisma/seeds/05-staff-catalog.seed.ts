import { SalonOwnerStatus } from '@prisma/client';
import type { SalonBranchesSeedResult } from './04-salon-branches.seed';
import type { SeedContext } from './seed-context';

export interface StaffCatalogSeedResult {
  readonly staffElena: { id: string; displayName: string };
  readonly staffKenji: { id: string; displayName: string };
  readonly staffYuki: { id: string; displayName: string };
  readonly staffRen: { id: string; displayName: string };
  readonly staffMio: { id: string; displayName: string };
  readonly srvSignatureCut: { id: string; name: string };
  readonly srvExpressCut: { id: string; name: string };
  readonly srvBalayage: { id: string; name: string };
  readonly srvHeadSpa: { id: string; name: string };
}

export async function seedStaffAndCatalog(context: SeedContext, salon: SalonBranchesSeedResult): Promise<StaffCatalogSeedResult> {
  const { prisma } = context;

  console.log('\n[5/7] Seeding Service Catalog & Staff Rosters...');

  // 1. Service Categories
  const catHaircut = await prisma.salonOwnerServiceCategory.upsert({
    where: { businessId_name: { businessId: salon.businessLumiere.id, name: 'Haircuts & Styling' } },
    update: { sortOrder: 1 },
    create: { businessId: salon.businessLumiere.id, name: 'Haircuts & Styling', sortOrder: 1 },
  });

  const catColor = await prisma.salonOwnerServiceCategory.upsert({
    where: { businessId_name: { businessId: salon.businessLumiere.id, name: 'Hair Coloring & Highlights' } },
    update: { sortOrder: 2 },
    create: { businessId: salon.businessLumiere.id, name: 'Hair Coloring & Highlights', sortOrder: 2 },
  });

  const catSpa = await prisma.salonOwnerServiceCategory.upsert({
    where: { businessId_name: { businessId: salon.businessLumiere.id, name: 'Treatments & Head Spa' } },
    update: { sortOrder: 3 },
    create: { businessId: salon.businessLumiere.id, name: 'Treatments & Head Spa', sortOrder: 3 },
  });

  // 2. Services
  const srvSignatureCut = await prisma.salonOwnerService.upsert({
    where: {
      businessId_categoryId_name: { businessId: salon.businessLumiere.id, categoryId: catHaircut.id, name: 'Signature Haircut & Styling' },
    },
    update: {},
    create: {
      businessId: salon.businessLumiere.id,
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
    where: { businessId_categoryId_name: { businessId: salon.businessLumiere.id, categoryId: catHaircut.id, name: 'Express Dry Cut' } },
    update: {},
    create: {
      businessId: salon.businessLumiere.id,
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
    where: {
      businessId_categoryId_name: { businessId: salon.businessLumiere.id, categoryId: catColor.id, name: 'Full Balayage & Glossing' },
    },
    update: {},
    create: {
      businessId: salon.businessLumiere.id,
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
    where: {
      businessId_categoryId_name: { businessId: salon.businessLumiere.id, categoryId: catSpa.id, name: 'Japanese Scalp Detox Spa' },
    },
    update: {},
    create: {
      businessId: salon.businessLumiere.id,
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
        businessId: salon.businessLumiere.id,
        categoryId: catColor.id,
        name: 'Seasonal Summer Sun Highlights (Archived)',
      },
    },
    update: {},
    create: {
      businessId: salon.businessLumiere.id,
      categoryId: catColor.id,
      name: 'Seasonal Summer Sun Highlights (Archived)',
      durationMinutes: 60,
      bufferMinutes: 0,
      basePrice: '7000.00',
      taxRatePercent: '10.00',
      status: SalonOwnerStatus.INACTIVE,
    },
  });

  // 3. Staff Profiles
  const staffElena = await prisma.salonOwnerStaff.upsert({
    where: { businessId_phone: { businessId: salon.businessLumiere.id, phone: '+81-90-1111-0001' } },
    update: { roles: ['OWNER', 'STYLIST'] },
    create: {
      businessId: salon.businessLumiere.id,
      displayName: 'Elena Vance',
      phone: '+81-90-1111-0001',
      email: 'owner.lumiere@example.com',
      roles: ['OWNER', 'STYLIST'],
      status: SalonOwnerStatus.ACTIVE,
    },
  });

  const staffKenji = await prisma.salonOwnerStaff.upsert({
    where: { businessId_phone: { businessId: salon.businessLumiere.id, phone: '+81-90-1111-0002' } },
    update: { roles: ['MANAGER'] },
    create: {
      businessId: salon.businessLumiere.id,
      displayName: 'Kenji Sato',
      phone: '+81-90-1111-0002',
      email: 'manager.kenji@example.com',
      roles: ['MANAGER'],
      status: SalonOwnerStatus.ACTIVE,
    },
  });

  const staffYuki = await prisma.salonOwnerStaff.upsert({
    where: { businessId_phone: { businessId: salon.businessLumiere.id, phone: '+81-90-1111-0003' } },
    update: { roles: ['STYLIST'] },
    create: {
      businessId: salon.businessLumiere.id,
      displayName: 'Yuki Tanaka',
      phone: '+81-90-1111-0003',
      email: 'stylist.yuki@example.com',
      roles: ['STYLIST'],
      status: SalonOwnerStatus.ACTIVE,
    },
  });

  const staffRen = await prisma.salonOwnerStaff.upsert({
    where: { businessId_phone: { businessId: salon.businessLumiere.id, phone: '+81-90-1111-0004' } },
    update: { roles: ['STYLIST'] },
    create: {
      businessId: salon.businessLumiere.id,
      displayName: 'Ren Takahashi',
      phone: '+81-90-1111-0004',
      email: 'stylist.ren@example.com',
      roles: ['STYLIST'],
      status: SalonOwnerStatus.ACTIVE,
    },
  });

  const staffMio = await prisma.salonOwnerStaff.upsert({
    where: { businessId_phone: { businessId: salon.businessLumiere.id, phone: '+81-90-1111-0005' } },
    update: { roles: ['RECEPTIONIST', 'CASHIER'] },
    create: {
      businessId: salon.businessLumiere.id,
      displayName: 'Mio Suzuki',
      phone: '+81-90-1111-0005',
      email: 'mio.suzuki@example.com',
      roles: ['RECEPTIONIST', 'CASHIER'],
      status: SalonOwnerStatus.ACTIVE,
    },
  });

  const staffInactive = await prisma.salonOwnerStaff.upsert({
    where: { businessId_phone: { businessId: salon.businessLumiere.id, phone: '+81-90-1111-0006' } },
    update: { status: SalonOwnerStatus.INACTIVE },
    create: {
      businessId: salon.businessLumiere.id,
      displayName: 'Taro Yamada (Inactive)',
      phone: '+81-90-1111-0006',
      roles: ['STYLIST'],
      status: SalonOwnerStatus.INACTIVE,
    },
  });

  // 4. Branch Assignments
  const branchAssignments = [
    { staffId: staffElena.id, branchId: salon.branchShibuya.id },
    { staffId: staffElena.id, branchId: salon.branchShinjuku.id },
    { staffId: staffKenji.id, branchId: salon.branchShibuya.id },
    { staffId: staffYuki.id, branchId: salon.branchShibuya.id },
    { staffId: staffRen.id, branchId: salon.branchShinjuku.id },
    { staffId: staffMio.id, branchId: salon.branchShibuya.id },
    { staffId: staffInactive.id, branchId: salon.branchShibuya.id },
  ];

  for (const a of branchAssignments) {
    await prisma.salonOwnerStaffBranch.upsert({
      where: { staffId_branchId: { staffId: a.staffId, branchId: a.branchId } },
      update: {},
      create: { staffId: a.staffId, branchId: a.branchId },
    });
  }

  // 5. Staff Role Assignments (ADR-0005)
  const lumiereRoles = await prisma.businessRole.findMany({ where: { businessId: salon.businessLumiere.id } });
  const roleOwner = lumiereRoles.find((r) => r.roleCode === 'OWNER')!;
  const roleManager = lumiereRoles.find((r) => r.roleCode === 'MANAGER')!;
  const roleStylist = lumiereRoles.find((r) => r.roleCode === 'STYLIST')!;
  const roleReceptionist = lumiereRoles.find((r) => r.roleCode === 'RECEPTIONIST')!;
  const roleCashier = lumiereRoles.find((r) => r.roleCode === 'CASHIER')!;

  const staffRolePairs = [
    { staffId: staffElena.id, roleId: roleOwner.id },
    { staffId: staffElena.id, roleId: roleStylist.id },
    { staffId: staffKenji.id, roleId: roleManager.id },
    { staffId: staffYuki.id, roleId: roleStylist.id },
    { staffId: staffRen.id, roleId: roleStylist.id },
    { staffId: staffMio.id, roleId: roleReceptionist.id },
    { staffId: staffMio.id, roleId: roleCashier.id },
    { staffId: staffInactive.id, roleId: roleStylist.id },
  ];

  for (const pair of staffRolePairs) {
    await prisma.staffRoleAssignment.upsert({
      where: {
        staffId_businessRoleId: {
          staffId: pair.staffId,
          businessRoleId: pair.roleId,
        },
      },
      update: {},
      create: {
        staffId: pair.staffId,
        businessRoleId: pair.roleId,
      },
    });
  }

  // 6. Skills Mapping
  const skillMappings = [
    { staffId: staffElena.id, serviceId: srvSignatureCut.id },
    { staffId: staffElena.id, serviceId: srvExpressCut.id },
    { staffId: staffElena.id, serviceId: srvBalayage.id },
    { staffId: staffElena.id, serviceId: srvHeadSpa.id },
    { staffId: staffYuki.id, serviceId: srvSignatureCut.id },
    { staffId: staffYuki.id, serviceId: srvBalayage.id },
    { staffId: staffYuki.id, serviceId: srvHeadSpa.id },
    { staffId: staffRen.id, serviceId: srvExpressCut.id },
  ];

  for (const s of skillMappings) {
    await prisma.salonOwnerStaffSkill.upsert({
      where: { staffId_serviceId: { staffId: s.staffId, serviceId: s.serviceId } },
      update: {},
      create: { staffId: s.staffId, serviceId: s.serviceId },
    });
  }

  // 7. Shifts
  await prisma.salonOwnerStaffShift.upsert({
    where: { staffId_branchId: { staffId: staffYuki.id, branchId: salon.branchShibuya.id } },
    update: {},
    create: {
      staffId: staffYuki.id,
      branchId: salon.branchShibuya.id,
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
    where: { staffId_branchId: { staffId: staffRen.id, branchId: salon.branchShinjuku.id } },
    update: {},
    create: {
      staffId: staffRen.id,
      branchId: salon.branchShinjuku.id,
      timezone: 'Asia/Tokyo',
      days: [
        { dayOfWeek: 1, intervals: [{ start: '09:00', end: '17:00' }] },
        { dayOfWeek: 2, intervals: [{ start: '09:00', end: '17:00' }] },
        { dayOfWeek: 3, intervals: [{ start: '09:00', end: '17:00' }] },
        { dayOfWeek: 4, intervals: [{ start: '09:00', end: '17:00' }] },
      ],
    },
  });

  // 8. Staff Personal Profiles & Identity Documents
  await prisma.staffPersonalProfile.upsert({
    where: { staffId: staffElena.id },
    update: {},
    create: {
      staffId: staffElena.id,
      legalName: 'Elena Vance',
      dateOfBirth: new Date('1990-05-15'),
      gender: 'FEMALE',
      addressLine1: '1-2-3 Shibuya',
      city: 'Shibuya-ku',
      state: 'Tokyo',
      postalCode: '150-0002',
      country: 'JP',
      emergencyContactName: 'Marcus Vance',
      emergencyContactRelationship: 'Spouse',
      emergencyContactPhone: '+81-90-9999-0001',
      employmentType: 'FULL_TIME',
      hireDate: new Date('2020-01-10'),
      payoutMethod: 'BANK_TRANSFER',
      bankName: 'Mizuho Bank',
      branchName: 'Shibuya Branch',
      branchCode: '210',
      accountType: 'ORDINARY',
      accountNumber: '1234567',
      accountHolderName: 'ELENA VANCE',
    },
  });

  await prisma.staffPersonalProfile.upsert({
    where: { staffId: staffKenji.id },
    update: {},
    create: {
      staffId: staffKenji.id,
      legalName: 'Kenji Sato',
      dateOfBirth: new Date('1988-11-20'),
      gender: 'MALE',
      addressLine1: '4-5-6 Harajuku',
      city: 'Shibuya-ku',
      state: 'Tokyo',
      postalCode: '150-0001',
      country: 'JP',
      emergencyContactName: 'Yoko Sato',
      emergencyContactRelationship: 'Mother',
      emergencyContactPhone: '+81-90-9999-0002',
      employmentType: 'FULL_TIME',
      hireDate: new Date('2021-03-01'),
      payoutMethod: 'BANK_TRANSFER',
      bankName: 'MUFG Bank',
      branchName: 'Shinjuku Branch',
      branchCode: '150',
      accountType: 'ORDINARY',
      accountNumber: '7654321',
      accountHolderName: 'KENJI SATO',
    },
  });

  await prisma.staffIdentityDocument.upsert({
    where: { id: '00000000-0000-4000-8000-000000000501' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000501',
      staffId: staffElena.id,
      documentType: 'DRIVERS_LICENSE',
      fileKey: 'secure/staff/elena-drivers-license.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 1048576,
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date('2020-01-15T10:00:00Z'),
    },
  });

  console.log('  ✓ Seeded Service Catalog, Staff, Assignments, Skills & Shifts');

  return {
    staffElena: { id: staffElena.id, displayName: staffElena.displayName },
    staffKenji: { id: staffKenji.id, displayName: staffKenji.displayName },
    staffYuki: { id: staffYuki.id, displayName: staffYuki.displayName },
    staffRen: { id: staffRen.id, displayName: staffRen.displayName },
    staffMio: { id: staffMio.id, displayName: staffMio.displayName },
    srvSignatureCut: { id: srvSignatureCut.id, name: srvSignatureCut.name },
    srvExpressCut: { id: srvExpressCut.id, name: srvExpressCut.name },
    srvBalayage: { id: srvBalayage.id, name: srvBalayage.name },
    srvHeadSpa: { id: srvHeadSpa.id, name: srvHeadSpa.name },
  };
}
