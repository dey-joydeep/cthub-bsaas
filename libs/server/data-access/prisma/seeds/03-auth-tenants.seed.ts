import { RegistrationStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import type { GeoSeedResult } from './01-geo-currencies.seed';
import type { SeedContext } from './seed-context';
import { SEED_IDS } from './seed-ids';

export interface AuthSeedResult {
  readonly userAdmin: { id: string; email: string };
  readonly userOwnerLumiere: { id: string; email: string };
  readonly userOwnerZen: { id: string; email: string };
  readonly userManagerKenji: { id: string; email: string };
  readonly userStylistYuki: { id: string; email: string };
  readonly userStylistRen: { id: string; email: string };
  readonly userCustomerAlice: { id: string; email: string };
  readonly userCustomerBob: { id: string; email: string };
  readonly coreCustomerAlice: { id: string };
  readonly coreCustomerBob: { id: string };
  readonly tenantLumiere: { id: string; name: string };
  readonly tenantZen: { id: string; name: string };
}

export async function seedAuthAndTenants(context: SeedContext, geo: GeoSeedResult): Promise<AuthSeedResult> {
  const { prisma } = context;

  console.log('\n[3/7] Seeding Auth & Multi-Tenant Identity...');
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
  const userOwnerZen = await seedUser('owner.zen@example.com', 'Master Jin (Barber Owner)', ['owner', 'SALON_OWNER']);
  const userManagerKenji = await seedUser('manager.kenji@example.com', 'Kenji Sato (Manager)', ['staff', 'SALON_MANAGER']);
  const userStylistYuki = await seedUser('stylist.yuki@example.com', 'Yuki Tanaka (Senior Stylist)', ['staff', 'SALON_STAFF']);
  const userStylistRen = await seedUser('stylist.ren@example.com', 'Ren Takahashi (Junior Stylist)', ['staff', 'SALON_STAFF']);
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

  // Salon Tenants
  const tenantLumiere = await prisma.salonTenant.upsert({
    where: { id: SEED_IDS.tenantLumiere },
    update: {},
    create: {
      id: SEED_IDS.tenantLumiere,
      name: 'Lumière Hair & Beauty Group',
      email: 'contact@lumiere-salon.jp',
      phone: '+81-3-5555-0100',
      businessAddressId: geo.addressShibuyaId,
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
      businessAddressId: geo.addressZenId,
      primaryColor: '#1E293B',
      secondaryColor: '#64748B',
      accentColor: '#0EA5E9',
    },
  });

  console.log('  ✓ Seeded Users (Admin, Owners, Managers, Stylists, Customers) and Salon Tenants');

  return {
    userAdmin: { id: userAdmin.id, email: userAdmin.email },
    userOwnerLumiere: { id: userOwnerLumiere.id, email: userOwnerLumiere.email },
    userOwnerZen: { id: userOwnerZen.id, email: userOwnerZen.email },
    userManagerKenji: { id: userManagerKenji.id, email: userManagerKenji.email },
    userStylistYuki: { id: userStylistYuki.id, email: userStylistYuki.email },
    userStylistRen: { id: userStylistRen.id, email: userStylistRen.email },
    userCustomerAlice: { id: userCustomerAlice.id, email: userCustomerAlice.email },
    userCustomerBob: { id: userCustomerBob.id, email: userCustomerBob.email },
    coreCustomerAlice: { id: coreCustomerAlice.id },
    coreCustomerBob: { id: coreCustomerBob.id },
    tenantLumiere: { id: tenantLumiere.id, name: tenantLumiere.name },
    tenantZen: { id: tenantZen.id, name: tenantZen.name },
  };
}
