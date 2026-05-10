import { config as dotenv } from 'dotenv';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

/**
 * Jest global setup for server integration tests.
 * - Loads `.env.test`
 * - Syncs Prisma schema to the test DB (db push)
 * - Seeds baseline roles, a tenant, and a test user used across ITs
 *
 * Excluded from build via tsconfig to avoid shipping test helpers.
 */
export default async function globalSetup() {
  dotenv({ path: resolve(process.cwd(), '.env.test') });

  const schemaPath = resolve(process.cwd(), 'libs/server/data-access/prisma/schema.prisma');
  const push = spawnSync('npx', ['prisma', 'db', 'push', '--skip-generate', '--schema', schemaPath], {
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  });
  if (push.status !== 0) {
    throw new Error('Failed to push Prisma schema for tests');
  }

  const prisma = new PrismaClient();
  const email = 'it-user@example.com';
  const password = 'P@ssw0rd!';
  const passwordHash = await bcrypt.hash(password, 10);

  const roleNames = ['admin', 'owner', 'staff', 'customer'];
  const roles: Role[] = [];
  for (const name of roleNames) {
    const r = await prisma.role.upsert({ where: { name }, create: { name }, update: {} });
    roles.push(r);
  }

  const tenant = await prisma.salonTenant.upsert({
    where: { email: 'it-tenant@example.com' },
    update: {},
    create: { name: 'IT Tenant', email: 'it-tenant@example.com', phone: '0000000000' },
  });

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, isActive: true, isVerified: true },
    create: { email, passwordHash, isActive: true, isVerified: true, salonTenantId: tenant.id, name: 'IT User' },
  });

  const customerRole = roles.find((r) => r.name === 'customer')!;
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: customerRole.id } },
    update: {},
    create: { userId: user.id, roleId: customerRole.id },
  });

  await prisma.$disconnect();
}

