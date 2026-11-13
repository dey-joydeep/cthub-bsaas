import type { SalonBranchesSeedResult } from './04-salon-branches.seed';
import type { SeedContext } from './seed-context';
import { SEED_IDS } from './seed-ids';

export interface CustomersCrmSeedResult {
  readonly custAlice: { id: string; displayName: string };
  readonly custBob: { id: string; displayName: string };
}

export async function seedCustomersCrm(context: SeedContext, salon: SalonBranchesSeedResult): Promise<CustomersCrmSeedResult> {
  const { prisma } = context;

  console.log('\n[6/7] Seeding Customers & CRM Notes...');

  const custAlice = await prisma.salonOwnerCustomer.upsert({
    where: { businessId_phone: { businessId: salon.businessLumiere.id, phone: '+81-90-2222-0001' } },
    update: {},
    create: {
      businessId: salon.businessLumiere.id,
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
    where: { businessId_phone: { businessId: salon.businessLumiere.id, phone: '+81-90-2222-0002' } },
    update: {},
    create: {
      businessId: salon.businessLumiere.id,
      displayName: 'Bob Johnson',
      phone: '+81-90-2222-0002',
      consentForMarketing: false,
      smsEnabled: false,
      emailEnabled: false,
      whatsappEnabled: false,
    },
  });

  // Customer CRM Notes
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

  console.log('  ✓ Seeded CRM Customers & Clinical/VIP Notes');

  return {
    custAlice: { id: custAlice.id, displayName: custAlice.displayName },
    custBob: { id: custBob.id, displayName: custBob.displayName },
  };
}
