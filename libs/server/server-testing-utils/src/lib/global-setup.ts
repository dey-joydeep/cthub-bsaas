import { config as dotenv } from 'dotenv';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { bindTestDatabaseTarget } from '../../../core/src/config/test-database-target.ts';

/**
 * Jest global setup for server integration tests.
 * - Loads `.env.test`
 * - Syncs Prisma schema to the test DB (db push)
 * - Seeds baseline roles, a tenant, and a test user used across ITs
 *
 * Excluded from build via tsconfig to avoid shipping test helpers.
 */
export default async function globalSetup() {
  const root =
    process.env['NX_WORKSPACE_ROOT'] && existsSync(resolve(process.env['NX_WORKSPACE_ROOT'], '.env.test'))
      ? process.env['NX_WORKSPACE_ROOT']
      : existsSync(resolve(process.cwd(), '.env.test'))
        ? process.cwd()
        : resolve(__dirname, '../../../../../');

  dotenv({ path: resolve(root, '.env.test') });
  const target = bindTestDatabaseTarget(process.env, root);

  const schemaPath = resolve(root, 'libs/server/data-access/prisma/schema.prisma');
  const push = spawnSync('npx', ['prisma', 'db', 'push', '--skip-generate', '--accept-data-loss', '--schema', schemaPath], {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: target.url },
    shell: process.platform === 'win32',
  });
  if (push.status !== 0) {
    throw new Error('Failed to push Prisma schema for tests');
  }

  const prisma = new PrismaClient({ datasources: { db: { url: target.url } } });
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
