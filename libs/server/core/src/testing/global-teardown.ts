import { config as dotenv } from 'dotenv';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';

/**
 * Jest global teardown for server integration tests.
 * - Loads `.env.test`
 * - Removes all data created by global-setup to leave DB clean
 *
 * Excluded from build via tsconfig.
 */
export default async function globalTeardown() {
  dotenv({ path: resolve(process.cwd(), '.env.test') });
  const prisma = new PrismaClient();
  const email = 'it-user@example.com';
  const roleNames = ['admin', 'owner', 'staff', 'customer'];
  const tenantEmail = 'it-tenant@example.com';

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
      await prisma.session.deleteMany({ where: { userId: user.id } });
      await prisma.userRole.deleteMany({ where: { userId: user.id } });
      await prisma.customer.deleteMany({ where: { userId: user.id } });
      await prisma.social.deleteMany({ where: { userId: user.id } });
      await prisma.credentialTOTP.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }

    // Remove seeded roles (detach any lingering links just in case)
    const roles = await prisma.role.findMany({ where: { name: { in: roleNames } } });
    const roleIds = roles.map((r) => r.id);
    if (roleIds.length) {
      await prisma.userRole.deleteMany({ where: { roleId: { in: roleIds } } });
      await prisma.role.deleteMany({ where: { id: { in: roleIds } } });
    }

    // Remove the seeded tenant
    const tenant = await prisma.salonTenant.findUnique({ where: { email: tenantEmail } });
    if (tenant) {
      await prisma.salonTenant.delete({ where: { id: tenant.id } });
    }
  } finally {
    await prisma.$disconnect();
  }
}
