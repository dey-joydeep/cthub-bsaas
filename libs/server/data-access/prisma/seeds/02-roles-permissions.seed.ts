import { UserRole } from '@cthub-bsaas/shared';
import { seedGlobalRoleMaster } from '../../src/lib/role-defaults';
import type { SeedContext } from './seed-context';

export async function seedRolesAndPermissions(context: SeedContext): Promise<void> {
  const { prisma } = context;

  console.log('\n[2/7] Seeding Global Master: Roles & Permissions (ADR-0005)...');

  // 1. Legacy / Core System Roles
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
  console.log(`  ✓ Seeded ${roleNames.length} system role definitions`);

  // 2. Global Role Master & Permission Master (ADR-0005)
  await seedGlobalRoleMaster(prisma);
  console.log('  ✓ Seeded Global PermissionMaster (26 capabilities) & RoleMaster presets (6 templates)');
}
